import contact, { EmployeeAccount, formatName } from '@hcengineering/contact'
import { Class, Doc, Hierarchy, Ref } from '@hcengineering/core'
import { getClient } from '@hcengineering/presentation'
import setting, { Integration } from '@hcengineering/setting'
import { TemplateDataProvider } from '@hcengineering/templates'

function isEditable (hierarchy: Hierarchy, p: Class<Doc>): boolean {
  let ancestors = [p._id]
  try {
    ancestors = [...hierarchy.getAncestors(p._id), p._id]
  } catch (err: any) {
    console.error(err)
  }
  for (const ao of ancestors) {
    try {
      const cl = hierarchy.getClass(ao)
      if (hierarchy.hasMixin(cl, setting.mixin.Editable) && hierarchy.as(cl, setting.mixin.Editable).value) {
        return true
      }
    } catch (err: any) {
      return false
    }
  }
  return false
}
export function filterDescendants (
  hierarchy: Hierarchy,
  ofClass: Ref<Class<Doc>> | undefined,
  res: Array<Class<Doc>>
): Array<Ref<Class<Doc>>> {
  let _classes = res
    .filter((it) => {
      try {
        return ofClass != null ? hierarchy.isDerived(it._id, ofClass) : true
      } catch (err: any) {
        return false
      }
    })
    .filter((it) => !(it.hidden ?? false))
    .filter((p) => isEditable(hierarchy, p))

  let len: number
  const _set = new Set(_classes.map((it) => it._id))
  do {
    len = _classes.length
    _classes = _classes.filter((it) => (it.extends != null ? !_set.has(it.extends) : false))
  } while (len !== _classes.length)

  return _classes.map((p) => p._id)
}

export async function getValue (provider: TemplateDataProvider): Promise<string | undefined> {
  const value = provider.get(setting.templateFieldCategory.Integration) as Integration
  if (value === undefined) return
  return value.value
}

export async function getOwnerName (provider: TemplateDataProvider): Promise<string | undefined> {
  const value = provider.get(setting.templateFieldCategory.Integration) as Integration
  if (value === undefined) return
  const client = getClient()
  const employeeAccount = await client.findOne(contact.class.EmployeeAccount, {
    _id: value.modifiedBy as Ref<EmployeeAccount>
  })
  return employeeAccount != null ? formatName(employeeAccount.name) : undefined
}
