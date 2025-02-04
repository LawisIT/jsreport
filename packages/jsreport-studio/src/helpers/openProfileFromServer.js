import storeMethods from '../redux/methods'
import api from '../helpers/api'
import resolveUrl from '../helpers/resolveUrl'
import openProfileFromStreamReader from '../helpers/openProfileFromStreamReader'

async function openProfileFromServer (profile = {}, openTemplateEditor = false) {
  if (profile._id == null) {
    throw new Error('profileId param is required')
  }

  let p = profile

  try {
    if (p.templateShortid == null) {
      p = (await api.get(`/odata/profiles(${p._id})`)).value[0]
    }

    let template

    if (p.template == null) {
      template = storeMethods.getEntityByShortid(p.templateShortid, false)
    } else {
      template = p.template
    }

    if (!template) {
      template = { name: 'anonymous', shortid: null, path: 'anonymous' }
    } else {
      template = { ...template, path: storeMethods.resolveEntityPath(template) }
    }

    if (template.shortid != null && openTemplateEditor) {
      // if template exists then open it and activate it
      storeMethods.openEditorTab({ shortid: template.shortid, entitySet: 'templates' })
    } else {
      // if anonymous just reset url
      storeMethods.openEditorTab({ shortid: ' ', entitySet: 'templates' })
    }

    await openProfileFromStreamReader(async () => {
      const getBlobUrl = resolveUrl(`/api/profile/${p._id}/events`)

      const response = await window.fetch(getBlobUrl, {
        method: 'GET',
        cache: 'no-cache'
      })

      if (response.status !== 200) {
        throw new Error(`Got not ok response, status: ${response.status}`)
      }

      return response.body.getReader()
    }, {
      name: template.name,
      shortid: template.shortid
    })
  } catch (e) {
    console.warn(`Error while trying to open profile "${p._id}"`, e)
  }
}

export default openProfileFromServer
