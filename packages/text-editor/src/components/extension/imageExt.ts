import { getMetadata } from '@hcengineering/platform'
import presentation, { getFileUrl } from '@hcengineering/presentation'
import { IconSize, getIconSize2x } from '@hcengineering/ui'
import { Node, createNodeFromContent, mergeAttributes, nodeInputRule } from '@tiptap/core'
import { Fragment, Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'
import { getDataAttribute } from '../../utils'

/**
 * @public
 */
export type FileAttachFunction = (file: File) => Promise<{ file: string, type: string } | undefined>

/**
 * @public
 */
export interface ImageOptions {
  inline: boolean
  HTMLAttributes: Record<string, any>

  attachFile?: FileAttachFunction

  reportNode?: (id: string, node: ProseMirrorNode) => void
}

export interface ImageAlignmentOptions {
  align?: 'center' | 'left' | 'right'
}

export interface ImageSizeOptions {
  height?: number | string
  width?: number | string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      /**
       * Add an image
       */
      setImage: (options: { src: string, alt?: string, title?: string }) => ReturnType
      /**
       * Set image alignment
       */
      setImageAlignment: (options: ImageAlignmentOptions) => ReturnType
      /**
       * Set image size
       */
      setImageSize: (options: ImageSizeOptions) => ReturnType
    }
  }
}

/**
 * @public
 */
export const inputRegex = /(?:^|\s)(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/

function getType (type: string): 'image' | 'other' {
  if (type.startsWith('image/')) {
    return 'image'
  }

  return 'other'
}

/**
 * @public
 */
export const ImageExtension = Node.create<ImageOptions>({
  name: 'image',

  addOptions () {
    return {
      inline: true,
      HTMLAttributes: {}
    }
  },

  inline () {
    return this.options.inline
  },

  group () {
    return this.options.inline ? 'inline' : 'block'
  },

  draggable: true,

  selectable: true,

  addAttributes () {
    return {
      'file-id': {
        default: null
      },
      width: {
        default: null
      },
      height: {
        default: null
      },
      src: {
        default: null
      },
      alt: {
        default: null
      },
      title: {
        default: null
      },
      align: getDataAttribute('align')
    }
  },

  parseHTML () {
    return [
      {
        tag: `img[data-type="${this.name}"]`
      }
    ]
  },

  renderHTML ({ node, HTMLAttributes }) {
    const divAttributes = {
      class: 'text-editor-image-container',
      'data-type': this.name,
      'data-align': node.attrs.align ?? 'center'
    }

    const imgAttributes = mergeAttributes(
      {
        'data-type': this.name
      },
      this.options.HTMLAttributes,
      HTMLAttributes
    )

    const id = imgAttributes['file-id']
    if (id != null) {
      imgAttributes.src = getFileUrl(id, 'full')
      let width: IconSize | undefined
      switch (imgAttributes.width) {
        case '32px':
          width = 'small'
          break
        case '64px':
          width = 'medium'
          break
        case '128px':
        case '256px':
          width = 'large'
          break
        case '512px':
          width = 'x-large'
          break
      }
      if (width !== undefined) {
        imgAttributes.src = getFileUrl(id, width)
        imgAttributes.srcset = getFileUrl(id, width) + ' 1x,' + getFileUrl(id, getIconSize2x(width)) + ' 2x'
      }
      imgAttributes.class = 'text-editor-image'
      imgAttributes.contentEditable = false
      this.options.reportNode?.(id, node)
    }

    return ['div', divAttributes, ['img', imgAttributes]]
  },

  addCommands () {
    return {
      setImage:
        (options) =>
          ({ commands }) => {
            return commands.insertContent({
              type: this.name,
              attrs: options
            })
          },

      setImageAlignment:
        (options) =>
          ({ chain, tr }) => {
            const { from } = tr.selection
            return chain()
              .updateAttributes(this.name, { ...options })
              .setNodeSelection(from)
              .run()
          },

      setImageSize:
        (options) =>
          ({ chain, tr }) => {
            const { from } = tr.selection
            return chain()
              .updateAttributes(this.name, { ...options })
              .setNodeSelection(from)
              .run()
          }
    }
  },

  addInputRules () {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: (match) => {
          const [, , alt, src, title] = match

          return { src, alt, title }
        }
      })
    ]
  },
  addProseMirrorPlugins () {
    const opt = this.options
    function handleDrop (
      view: EditorView,
      pos: { pos: number, inside: number } | null,
      dataTransfer: DataTransfer
    ): any {
      const uris = (dataTransfer.getData('text/uri-list') ?? '').split('\r\n').filter((it) => !it.startsWith('#'))
      let result = false
      for (const uri of uris) {
        if (uri !== '') {
          const url = new URL(uri)
          const uploadUrl = getMetadata(presentation.metadata.UploadURL)
          if (uploadUrl === undefined || !url.href.includes(uploadUrl)) {
            continue
          }

          const _file = (url.searchParams.get('file') ?? '').split('/').join('')

          if (_file.trim().length === 0) {
            continue
          }

          const ctype = dataTransfer.getData('application/contentType')
          const type = getType(ctype ?? 'other')

          let content: ProseMirrorNode | Fragment | undefined
          if (type === 'image') {
            content = createNodeFromContent(
              `<img data-type='image' width='75%' file-id='${_file}'></img>`,
              view.state.schema,
              {
                parseOptions: {
                  preserveWhitespace: 'full'
                }
              }
            )
          }
          if (content !== undefined) {
            view.dispatch(view.state.tr.insert(pos?.pos ?? 0, content))
            result = true
          }
        }
      }
      if (result) {
        return result
      }

      const files = dataTransfer?.files
      if (files !== undefined && opt.attachFile !== undefined) {
        for (let i = 0; i < files.length; i++) {
          const file = files.item(i)
          if (file != null) {
            result = true
            void opt.attachFile(file).then((id) => {
              if (id !== undefined) {
                if (id.type.includes('image')) {
                  const content = createNodeFromContent(
                    `<img data-type='image' width='75%' file-id='${id.file}'></img>`,
                    view.state.schema,
                    {
                      parseOptions: {
                        preserveWhitespace: 'full'
                      }
                    }
                  )
                  view.dispatch(view.state.tr.insert(pos?.pos ?? 0, content))
                }
              }
            })
          }
        }
      }
      return result
    }
    return [
      new Plugin({
        key: new PluginKey('handle-image-paste'),
        props: {
          handlePaste (view, event) {
            const dataTransfer = event.clipboardData
            if (dataTransfer !== null) {
              const res = handleDrop(view, { pos: view.state.selection.$from.pos, inside: 0 }, dataTransfer)
              if (res === true) {
                event.preventDefault()
                event.stopPropagation()
              }
              return res
            }
          },
          handleDrop (view, event) {
            event.preventDefault()
            event.stopPropagation()
            const dataTransfer = event.dataTransfer
            if (dataTransfer !== null) {
              return handleDrop(view, view.posAtCoords({ left: event.x, top: event.y }), dataTransfer)
            }
          }
        }
      })
    ]
  }
})
