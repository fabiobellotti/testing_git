// Copyright © 2022 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.

import { Resources } from '@anticrm/platform'
import { TagElement } from '@anticrm/tags'
import { eventToHTMLElement, showPopup } from '@anticrm/ui'
import TagsCategoryBar from './components/CategoryBar.svelte'
import CategoryPresenter from './components/CategoryPresenter.svelte'
import EditTagElement from './components/EditTagElement.svelte'
import TagElementPresenter from './components/TagElementPresenter.svelte'
import TagReferencePresenter from './components/TagReferencePresenter.svelte'
import Tags from './components/Tags.svelte'
import TagsDropdownEditor from './components/TagsDropdownEditor.svelte'
import TagsEditor from './components/TagsEditor.svelte'
import TagsItemPresenter from './components/TagsItemPresenter.svelte'
import TagsPresenter from './components/TagsPresenter.svelte'
import TagsView from './components/TagsView.svelte'
import TagElementCountPresenter from './components/TagElementCountPresenter.svelte'
import TagsFilter from './components/TagsFilter.svelte'
import TagsCollectionEditor from './components/TagsCollectionEditor.svelte'
import TagsEditorPopup from './components/TagsEditorPopup.svelte'
import { ObjQueryType } from '@anticrm/core'
import { TagFilterQuery } from './utils'

export async function tagsInResult (res: any[], onUpdate: () => void, index: number): Promise<ObjQueryType<any>> {
  const result = await TagFilterQuery.getRefs(res, onUpdate, index)
  return { $in: result }
}

export async function tagsNinResult (res: any[], onUpdate: () => void, index: number): Promise<ObjQueryType<any>> {
  const result = await TagFilterQuery.getRefs(res, onUpdate, index)
  return { $nin: result }
}

export default async (): Promise<Resources> => ({
  component: {
    Tags,
    TagReferencePresenter,
    TagElementPresenter,
    TagsPresenter,
    TagsView,
    TagsFilter,
    TagsEditor,
    TagsDropdownEditor,
    TagsItemPresenter,
    CategoryPresenter,
    TagsCategoryBar,
    TagElementCountPresenter,
    TagsCollectionEditor,
    TagsEditorPopup
  },
  actionImpl: {
    Open: (value: TagElement, evt: MouseEvent) => {
      showPopup(EditTagElement, { value, keyTitle: '' }, eventToHTMLElement(evt))
    }
  },
  function: {
    FilterTagsInResult: tagsInResult,
    FilterTagsNinResult: tagsNinResult
  }
})
