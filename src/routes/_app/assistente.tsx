import { Fragment, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Bot, SendHorizontal, ShieldCheck, Trash2 } from 'lucide-react'
import { apiErrorMessage, apiErrorStatus, assistantApi } from '#/api/api'
import type { AssistantMessage } from '#/api/types'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { Textarea } from '#/components/ui/textarea'
import { useAuth } from '#/features/auth/auth-store'
import { cn, generateId, getInitials } from '#/lib/utils'

export const Route = createFileRoute('/_app/assistente')({
  component: AssistantPage,
})

const initialSuggestions = [
  'Qual é o meu saldo?',
  'Onde gastei mais este mês?',
  'Me dê um resumo do mês',
  'Como posso economizar?',
]

/** Renderiza apenas **negrito** (sem interpretar HTML vindo da IA). Quebras de linha via white-space: pre-line. */
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
  const [messages, setMessages] = useState<Array<AssistantMessage> | null>(null)
  const [suggestions, setSuggestions] =
    useState<Array<string>>(initialSuggestions)
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [disabled, setDisabled] = useState<string | null>(null)
  const [source, setSource] = useState<'REMOTE' | 'LOCAL' | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    assistantApi.messages(50).then(setMessages, () => setMessages([]))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, pending])

  async function send(text: string) {
    const content = text.trim()
    if (!content || pending) return
    const now = new Date().toISOString()
    setMessages((m) => [
      ...(m ?? []),
      { id: generateId(), role: 'USER', content, createdAt: now },
    ])
    setInput('')
    setPending(true)
    try {
      const res = await assistantApi.chat(content)
      setSource(res.source)
      if (res.suggestions.length > 0) setSuggestions(res.suggestions)
      setMessages((m) => [
        ...(m ?? []),
        {
          id: res.messageId,
          role: 'ASSISTANT',
          content: res.reply,
          source: res.source,
          createdAt: res.createdAt,
        },
      ])
    } catch (err) {
      if (apiErrorStatus(err) === 422) setDisabled(apiErrorMessage(err))
      setMessages((m) => [
        ...(m ?? []),
        {
          id: generateId(),
          role: 'ASSISTANT',
          content: apiErrorMessage(err),
          createdAt: now,
        },
      ])
    } finally {
      setPending(false)
    }
  }

  async function clear() {
    if (!window.confirm('Apagar toda a conversa com o assistente?')) return
    await assistantApi.clear()
    setMessages([])
    setSuggestions(initialSuggestions)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void send(input)
  }

  return (
    <div className="flex h-[calc(100svh-4rem-2rem)] flex-col gap-4 md:h-[calc(100svh-4rem-3rem)] lg:h-[calc(100svh-4rem-4rem)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            Assistente financeiro
            {source === 'LOCAL' && (
              <Badge
                variant="outline"
                title="O serviço de IA ainda não está ligado; respostas geradas por regras locais."
              >
                Respostas por regras
              </Badge>
            )}
          </h1>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 shrink-0" />O assistente apenas
            analisa e recomenda — nenhuma transferência ou pagamento é feito sem
            sua autorização.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void clear()}
          disabled={!messages?.length}
        >
          <Trash2 /> <span className="hidden sm:inline">Limpar conversa</span>
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col gap-0 py-0">
        <div
          className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6"
          aria-live="polite"
        >
          {messages === null ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-2/3" />
              <Skeleton className="ml-auto h-10 w-1/3" />
            </div>
          ) : (
            <>
              <div className="flex gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed">
                  Olá{user ? `, ${user.name.split(' ')[0]}` : ''}! Sou o
                  assistente financeiro da Nummia. Posso consultar seu saldo,
                  resumir o mês, explicar seus principais gastos e sugerir
                  oportunidades de economia.
                </div>
              </div>
              {messages.map((message) => {
                const mine = message.role === 'USER'
                return (
                  <div
                    key={message.id}
                    className={cn('flex gap-3', mine && 'flex-row-reverse')}
                  >
                    <Avatar className="size-8">
                      <AvatarFallback
                        className={cn(
                          !mine && 'bg-primary text-primary-foreground',
                        )}
                      >
                        {mine ? (
                          getInitials(user?.name ?? 'Você')
                        ) : (
                          <Bot className="size-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line',
                        mine
                          ? 'rounded-tr-sm bg-primary text-primary-foreground'
                          : 'rounded-tl-sm bg-muted',
                      )}
                    >
                      {renderText(message.content)}
                    </div>
                  </div>
                )
              })}
            </>
          )}
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
          {disabled ? (
            <p className="text-sm text-muted-foreground">
              {disabled}{' '}
              <Link
                to="/configuracoes"
                className="font-medium text-primary hover:underline"
              >
                Abrir configurações
              </Link>
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-full"
                  disabled={pending}
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
              maxLength={1000}
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
