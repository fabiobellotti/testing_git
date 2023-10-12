import { Editor, Extension } from '@tiptap/core'

const canBlur = (editor: Editor): boolean => {
  return (
    !editor.isActive('bulletList') &&
    !editor.isActive('orderedList') &&
    !editor.isActive('code') &&
    !editor.isActive('codeBlock')
  )
}

export interface FocusOptions {
  onCanBlur?: (canBlur: boolean) => void
  onFocus?: (focused: boolean) => void
}

export interface FocusStorage {
  canBlur: boolean
}

export const FocusExtension = Extension.create<FocusOptions, FocusStorage>({
  addStorage () {
    return { canBlur: true }
  },
  onCreate () {
    this.options.onFocus?.(this.editor.isFocused)

    this.storage.canBlur = canBlur(this.editor)
    this.options.onCanBlur?.(this.storage.canBlur)
  },
  onBlur () {
    this.options.onFocus?.(false)
  },
  onFocus () {
    this.options.onFocus?.(true)
  },
  onSelectionUpdate () {
    const canBlurNow = canBlur(this.editor)

    if (this.storage.canBlur !== canBlurNow) {
      this.storage.canBlur = canBlurNow
      this.options.onCanBlur?.(this.storage.canBlur)
    }
  }
})
