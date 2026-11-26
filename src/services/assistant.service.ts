import { api } from '#/lib/api'
import { env } from '#/lib/env'
import { delay, formatCurrency, generateId } from '#/lib/utils'
import { dashboardService } from './dashboard.service'
import type { ChatMessage } from '#/types'

/**
 * Respostas simuladas do Agente Financeiro. No produto real, o front-end
 * envia a mensagem ao back-end, que orquestra os agentes de IA (n8n / LangGraph)
 * com os dados já calculados pelas regras de negócio.
 */
async function mockReply(message: string): Promise<string> {
  const text = message.toLowerCase()
  const summary = await dashboardService.summary()
  const top = summary.spendingByCategory.at(0)

  if (text.includes('saldo')) {
    return `Seu saldo consolidado hoje é de **${formatCurrency(summary.totalBalance)}**, somando todas as contas cadastradas.`
  }
  if (
    text.includes('maior') ||
    text.includes('principal') ||
    text.includes('gastei mais')
  ) {
    return top
      ? `Sua maior despesa do mês é **${top.name}**, com ${formatCurrency(top.amount)}. Isso representa ${Math.round((top.amount / summary.monthExpense) * 100)}% dos seus gastos.`
      : 'Ainda não encontrei despesas neste mês.'
  }
  if (
    text.includes('economi') ||
    text.includes('dica') ||
    text.includes('sugest')
  ) {
    const over = summary.spendingByCategory.filter(
      (c) => c.limit && c.amount > c.limit,
    )
    if (over.length > 0) {
      return `Encontrei ${over.length} categoria(s) acima do limite: ${over.map((c) => c.name).join(', ')}. Uma boa oportunidade de economia é revisar esses gastos e definir um teto semanal.`
    }
    return 'Seus gastos estão dentro dos limites planejados. Que tal direcionar a sobra do mês para uma das suas metas?'
  }
  if (text.includes('resumo') || text.includes('mês') || text.includes('mes')) {
    return `Resumo do mês: entradas de **${formatCurrency(summary.monthIncome)}**, saídas de **${formatCurrency(summary.monthExpense)}** e taxa de economia de ${Math.round(summary.savingsRate * 100)}%.`
  }
  return 'Posso te ajudar com seu saldo, um resumo do mês, seus principais gastos ou sugestões de economia. O que você quer saber?'
}

export const assistantService = {
  async send(
    message: string,
    history: Array<ChatMessage>,
  ): Promise<ChatMessage> {
    if (env.useMocks) {
      await delay(700)
      return {
        id: generateId(),
        role: 'assistant',
        content: await mockReply(message),
        createdAt: new Date().toISOString(),
      }
    }
    const { data } = await api.post<ChatMessage>('/assistant/chat', {
      message,
      history: history.slice(-10),
    })
    return data
  },
}
