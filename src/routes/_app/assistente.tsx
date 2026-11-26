import { Fragment, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Bot, SendHorizontal, ShieldCheck } from 'lucide-react'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Textarea } from '#/components/ui/textarea'
import { useAuth } from '#/features/auth/auth-store'
import { getErrorMessage } from '#/lib/api'
import { cn, generateId, getInitials } from '#/lib/utils'
import { assistantService } from '#/services/assistant.service'
import type { ChatMessage } from '#/types'

export const Route = createFileRoute('/_app/assistente')({
  component: AssistantPage,
})

const suggestions = [
  'Qual é o meu saldo?',
  'Onde gastei mais este mês?',
  'Me dê um resumo do mês',
  'Como posso economizar?',
]

/** Renderiza apenas **negrito**, sem interpretar HTML vindo da IA. */
function renderText(text: string): ReactNode {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    )
}

function AssistantPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Array<ChatMessage>>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá! Sou o assistente financeiro da Nummia. Posso consultar seu saldo, resumir o mês, explicar seus principais gastos e sugerir oportunidades de economia.',
      createdAt: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, pending])

  async function send(text: string) {
    const content = text.trim()
    if (!content || pending) return
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    const history = [...messages, userMessage]
    setMessages(history)
    setInput('')
    setPending(true)
    try {
      const reply = await assistantService.send(content, history)
      setMessages((m) => [...m, reply])
    } catch (error) {
      setMessages((m) => [
        ...m,
        {
          id: generateId(),
          role: 'assistant',
          content: getErrorMessage(error),
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setPending(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void send(input)
  }

  return (
    <div className="flex h-[calc(100svh-4rem-2rem)] flex-col gap-4 md:h-[calc(100svh-4rem-3rem)] lg:h-[calc(100svh-4rem-4rem)]">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Assistente financeiro
        </h1>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />O assistente apenas analisa e
          recomenda — nenhuma transferência ou pagamento é feito sem sua
          autorização.
        </p>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col gap-0 py-0">
        <div
          className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6"
          aria-live="polite"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' && 'flex-row-reverse',
              )}
            >
              <Avatar className="size-8">
                <AvatarFallback
                  className={cn(
                    message.role === 'assistant' &&
                      'bg-primary text-primary-foreground',
                  )}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="size-4" />
                  ) : (
                    getInitials(user?.name ?? 'Você')
                  )}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                  message.role === 'assistant'
                    ? 'rounded-tl-sm bg-muted'
                    : 'rounded-tr-sm bg-primary text-primary-foreground',
                )}
              >
                {renderText(message.content)}
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex gap-3">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div
                className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3"
                aria-label="Digitando"
              >
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="space-y-3 border-t p-3 md:p-4">
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => void send(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send(input)
                }
              }}
              rows={1}
              placeholder="Pergunte algo sobre suas finanças…"
              aria-label="Mensagem"
              className="max-h-40 min-h-10 resize-none"
            />
            <Button
              type="submit"
              size="icon"
              className="size-10"
              disabled={!input.trim() || pending}
              aria-label="Enviar"
            >
              <SendHorizontal />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
