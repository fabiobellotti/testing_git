//
// Copyright © 2020 Anticrm Platform Contributors.
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
//

import { Resources } from '@hcengineering/platform'
import { getEventPopupPositionElement, PopupAlignment } from '@hcengineering/ui'
import { actionImpl } from './actionImpl'
import ActionsPopup from './components/ActionsPopup.svelte'
import BooleanEditor from './components/BooleanEditor.svelte'
import BooleanPresenter from './components/BooleanPresenter.svelte'
import BooleanTruePresenter from './components/BooleanTruePresenter.svelte'
import ClassAttributeBar from './components/ClassAttributeBar.svelte'
import ClassPresenter from './components/ClassPresenter.svelte'
import ClassRefPresenter from './components/ClassRefPresenter.svelte'
import ColorsPopup from './components/ColorsPopup.svelte'
import DateEditor from './components/DateEditor.svelte'
import DatePresenter from './components/DatePresenter.svelte'
import DocAttributeBar from './components/DocAttributeBar.svelte'
import DocNavLink from './components/DocNavLink.svelte'
import EditBoxPopup from './components/EditBoxPopup.svelte'
import EditDoc from './components/EditDoc.svelte'
import EnumArrayEditor from './components/EnumArrayEditor.svelte'
import EnumEditor from './components/EnumEditor.svelte'
import EnumPresenter from './components/EnumPresenter.svelte'
import FilterBar from './components/filter/FilterBar.svelte'
import FilterTypePopup from './components/filter/FilterTypePopup.svelte'
import ObjectFilter from './components/filter/ObjectFilter.svelte'
import TimestampFilter from './components/filter/TimestampFilter.svelte'
import ValueFilter from './components/filter/ValueFilter.svelte'
import HTMLEditor from './components/HTMLEditor.svelte'
import HTMLPresenter from './components/HTMLPresenter.svelte'
import HyperlinkPresenter from './components/HyperlinkPresenter.svelte'
import IntlStringPresenter from './components/IntlStringPresenter.svelte'
import GithubPresenter from './components/linkPresenters/GithubPresenter.svelte'
import YoutubePresenter from './components/linkPresenters/YoutubePresenter.svelte'
import GrowPresenter from './components/list/GrowPresenter.svelte'
import ListView from './components/list/ListView.svelte'
import SortableList from './components/list/SortableList.svelte'
import SortableListItem from './components/list/SortableListItem.svelte'
import MarkupEditor from './components/MarkupEditor.svelte'
import MarkupEditorPopup from './components/MarkupEditorPopup.svelte'
import MarkupPresenter from './components/MarkupPresenter.svelte'
import Menu from './components/Menu.svelte'
import TreeItem from './components/navigator/TreeItem.svelte'
import TreeNode from './components/navigator/TreeNode.svelte'
import NumberEditor from './components/NumberEditor.svelte'
import NumberPresenter from './components/NumberPresenter.svelte'
import ObjectPresenter from './components/ObjectPresenter.svelte'
import RolePresenter from './components/RolePresenter.svelte'
import SpacePresenter from './components/SpacePresenter.svelte'
import SpaceRefPresenter from './components/SpaceRefPresenter.svelte'
import StringEditor from './components/StringEditor.svelte'
import StringPresenter from './components/StringPresenter.svelte'
import Table from './components/Table.svelte'
import TableBrowser from './components/TableBrowser.svelte'
import TimestampPresenter from './components/TimestampPresenter.svelte'
import UpDownNavigator from './components/UpDownNavigator.svelte'
import ValueSelector from './components/ValueSelector.svelte'
import ViewletSettingButton from './components/ViewletSettingButton.svelte'
import StatusPresenter from './components/status/StatusPresenter.svelte'
import StatusRefPresenter from './components/status/StatusRefPresenter.svelte'

import {
  afterResult,
  beforeResult,
  nestedDontMatchResult,
  nestedMatchResult,
  objectInResult,
  objectNinResult,
  valueInResult,
  valueNinResult
} from './filter'

import { IndexedDocumentPreview } from '@hcengineering/presentation'
import { showEmptyGroups } from './viewOptions'
import { statusSort } from './utils'
export { getActions, invokeAction } from './actions'
export { default as ActionContext } from './components/ActionContext.svelte'
export { default as ActionHandler } from './components/ActionHandler.svelte'
export { default as FilterButton } from './components/filter/FilterButton.svelte'
export { default as FixedColumn } from './components/FixedColumn.svelte'
export { default as SourcePresenter } from './components/inference/SourcePresenter.svelte'
export { default as LinkPresenter } from './components/LinkPresenter.svelte'
export { default as List } from './components/list/List.svelte'
export { default as MarkupPresenter } from './components/MarkupPresenter.svelte'
export { default as MarkupPreviewPopup } from './components/MarkupPreviewPopup.svelte'
export { default as ContextMenu } from './components/Menu.svelte'
export { default as ObjectBox } from './components/ObjectBox.svelte'
export { default as ObjectPresenter } from './components/ObjectPresenter.svelte'
export { default as ObjectSearchBox } from './components/ObjectSearchBox.svelte'
export { default as StatusPresenter } from './components/status/StatusPresenter.svelte'
export { default as StatusRefPresenter } from './components/status/StatusRefPresenter.svelte'
export { default as TableBrowser } from './components/TableBrowser.svelte'
export { default as ValueSelector } from './components/ValueSelector.svelte'
export * from './context'
export * from './filter'
export * from './selection'
export * from './utils'
export {
  buildModel,
  getActiveViewletId,
  getAdditionalHeader,
  getCategories,
  getCollectionCounter,
  getFiltredKeys,
  getObjectPresenter,
  getObjectPreview,
  groupBy,
  isCollectionAttr,
  LoadingProps,
  setActiveViewletId
} from './utils'
export * from './viewOptions'
export {
  HTMLPresenter,
  Table,
  DateEditor,
  DocAttributeBar,
  EditDoc,
  ColorsPopup,
  Menu,
  SpacePresenter,
  UpDownNavigator,
  ViewletSettingButton,
  FilterBar,
  ClassAttributeBar,
  ClassPresenter,
  BooleanEditor,
  BooleanPresenter,
  NumberEditor,
  NumberPresenter,
  TimestampPresenter,
  SortableList,
  SortableListItem,
  MarkupEditor,
  TreeNode,
  TreeItem,
  StringEditor,
  DocNavLink,
  EnumEditor,
  StringPresenter,
  EditBoxPopup
}

function PositionElementAlignment (e?: Event): PopupAlignment | undefined {
  return getEventPopupPositionElement(e)
}

export default async (): Promise<Resources> => ({
  actionImpl,
  component: {
    ClassPresenter,
    ClassRefPresenter,
    ObjectFilter,
    ValueFilter,
    TimestampFilter,
    TableBrowser,
    SpacePresenter,
    StringEditor,
    StringPresenter,
    HyperlinkPresenter,
    NumberEditor,
    NumberPresenter,
    BooleanPresenter,
    BooleanEditor,
    TimestampPresenter,
    DateEditor,
    DatePresenter,
    RolePresenter,
    ObjectPresenter,
    EditDoc,
    HTMLPresenter,
    IntlStringPresenter,
    GithubPresenter,
    YoutubePresenter,
    ActionsPopup,
    StringEditorPopup: EditBoxPopup,
    MarkupPresenter,
    MarkupEditor,
    MarkupEditorPopup,
    BooleanTruePresenter,
    EnumEditor,
    FilterTypePopup,
    ValueSelector,
    HTMLEditor,
    ListView,
    GrowPresenter,
    IndexedDocumentPreview,
    SpaceRefPresenter,
    EnumArrayEditor,
    EnumPresenter,
    StatusPresenter,
    StatusRefPresenter
  },
  popup: {
    PositionElementAlignment
  },
  function: {
    FilterObjectInResult: objectInResult,
    FilterObjectNinResult: objectNinResult,
    FilterValueInResult: valueInResult,
    FilterValueNinResult: valueNinResult,
    FilterBeforeResult: beforeResult,
    FilterAfterResult: afterResult,
    FilterNestedMatchResult: nestedMatchResult,
    FilterNestedDontMatchResult: nestedDontMatchResult,
    ShowEmptyGroups: showEmptyGroups,
    StatusSort: statusSort
  }
})
