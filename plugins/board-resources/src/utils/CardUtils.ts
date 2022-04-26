import { Card } from '@anticrm/board'
import { EmployeeAccount } from '@anticrm/contact'
import { TxOperations as Client, TxResult, getCurrentAccount } from '@anticrm/core'
import { showPanel } from '@anticrm/ui'

import board from '../plugin'

export function updateCard (client: Client, card: Card, field: string, value: any): Promise<TxResult> | undefined {
  if (!card) {
    return
  }
  return client.update(card, { [field]: value })
}

export function openCardPanel (card: Card): boolean {
  if (!card) {
    return false
  }

  showPanel(board.component.EditCard, card._id, card._class, 'middle')
  return true
}

export function deleteCard (card: Card, client: Client): Promise<TxResult> {
  return client.remove(card)
}

export function isArchived (card: Card): boolean {
  return !!card.isArchived
}

export function isUnarchived (card: Card): boolean {
  return !card.isArchived
}

export function canAddCurrentUser (card: Card): boolean {
  if (card.members == null) {
    return true
  }
  const employee = (getCurrentAccount() as EmployeeAccount).employee

  return !card.members.includes(employee)
}

export function hasCover (card: Card): boolean {
  return !!card.coverColor || !!card.coverImage
}

export function hasDate (card: Card): boolean {
  return !!card.date && (!!card.date.dueDate || !!card.date.startDate)
}

export function addCurrentUser (card: Card, client: Client): Promise<TxResult> | undefined {
  const employee = (getCurrentAccount() as EmployeeAccount).employee

  if (card.members?.includes(employee)) {
    return
  }

  return client.update(card, { $push: { members: employee } })
}

export function archiveCard (card: Card, client: Client): Promise<TxResult> | undefined {
  return updateCard(client, card, 'isArchived', true)
}

export function unarchiveCard (card: Card, client: Client): Promise<TxResult> | undefined {
  return updateCard(client, card, 'isArchived', false)
}
