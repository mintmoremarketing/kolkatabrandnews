import { draftMode, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
export async function GET(request: Request) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug') || ''
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return new Response('Invalid preview slug', { status: 400 })
  ;(await draftMode()).enable()
  return NextResponse.redirect(new URL(`/articles/${slug}`, request.url))
}
