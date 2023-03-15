import { writable } from 'svelte/store'
import { getCurrentLocation, navigate } from './location'
import { AnyComponent, PopupAlignment } from './types'

export interface PanelProps {
  component: AnyComponent
  _id: string
  _class: string
  element?: PopupAlignment
  rightSection?: AnyComponent
}

export const panelstore = writable<{ panel?: PanelProps | undefined }>({ panel: undefined })
let currentLocation: string | undefined

export function getPanelURI (component: AnyComponent, _id: string, _class: string, element?: PopupAlignment): string {
  const panelProps = [component, _id, _class]
  if (typeof element === 'string') {
    panelProps.push(element)
  }
  return encodeURIComponent(panelProps.join('|'))
}

export function showPanel (
  component: AnyComponent,
  _id: string,
  _class: string,
  element?: PopupAlignment,
  rightSection?: AnyComponent
): void {
  openPanel(component, _id, _class, element, rightSection)
  const location = getCurrentLocation()
  if (location.fragment !== currentLocation) {
    location.fragment = currentLocation
    navigate(location)
  }
}

export function openPanel (
  component: AnyComponent,
  _id: string,
  _class: string,
  element?: PopupAlignment,
  rightSection?: AnyComponent
): void {
  const newLoc = getPanelURI(component, _id, _class, element)
  if (currentLocation === newLoc) {
    return
  }
  currentLocation = newLoc
  panelstore.update(() => {
    return { panel: { component, _id, _class, element, rightSection } }
  })
}

export function closePanel (shoulRedirect: boolean = true): void {
  panelstore.update(() => {
    return { panel: undefined }
  })
  if (shoulRedirect) {
    const location = getCurrentLocation()
    location.fragment = undefined
    currentLocation = undefined
    navigate(location)
  }
}
