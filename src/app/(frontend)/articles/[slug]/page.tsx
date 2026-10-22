import { notFound } from 'next/navigation'
import { getContent } from '@/lib/content'
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { articles } = await getContent()
  const article = articles.find(a => a.slug === slug)
  return { title: article?.title || 'Article not found', description: article?.description }
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { articles } = await getContent()
  const index = articles.findIndex(a => a.slug === slug)
  if (index < 0) notFound()
  return null
}
