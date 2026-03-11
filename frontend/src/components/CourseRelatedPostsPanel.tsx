import { Anchor, Badge, Card, Container, Image, Stack, Text } from '@mantine/core'
import { CourseDetailResponse } from '../types/courseType'
import styles from '../styles/components/CourseRelatedPostsPanel.module.css'

interface CourseRelatedPostsPanelProps {
  course: CourseDetailResponse | null | undefined;
  isLoading: boolean;
}

const CourseRelatedPostsPanel: React.FC<CourseRelatedPostsPanelProps> = ({ course, isLoading }) => {
  if (isLoading) {
    return <>載入中...</>
  }

  const relatedPosts = course?.related_posts ?? []

  return (
    <Container className={styles.container}>
      <Text fw={900} className={styles.heading}>Dcard 相關貼文</Text>
      {relatedPosts.length === 0 ? (
        <Text c='dimmed'>目前還沒有抓到與這門課相關的臺南大學板貼文。</Text>
      ) : (
        <Stack gap='md'>
          {relatedPosts.map((post) => (
            <Card
              key={post.id}
              component='a'
              href={post.post_url}
              target='_blank'
              rel='noreferrer'
              withBorder
              className={styles.card}
            >
              <div className={styles.previewCard}>
                <div className={styles.previewMedia}>
                  {post.preview_image_url ? (
                    <Image
                      src={post.preview_image_url}
                      alt={post.preview_title || post.title}
                      radius='sm'
                      className={styles.previewImage}
                    />
                  ) : (
                    <div className={styles.previewFallback}>D</div>
                  )}
                </div>
                <div className={styles.previewContent}>
                  <Text size='xs' c='dimmed' className={styles.meta}>
                    {(post.preview_site_name || 'Dcard')} · {new Date(post.created_at_source).toLocaleDateString()}
                  </Text>
                  <Anchor
                    href={post.post_url}
                    target='_blank'
                    rel='noreferrer'
                    className={styles.link}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {post.preview_title || post.title}
                  </Anchor>
                  {(post.preview_description || post.excerpt) && (
                    <Text size='sm' c='dimmed' className={styles.description}>
                      {post.preview_description || post.excerpt}
                    </Text>
                  )}
                  <div className={styles.footerRow}>
                    {post.comments_json && post.comments_json.length > 0 && (
                      <Text size='xs' c='dimmed' className={styles.commentCount}>
                        {post.comments_json.length} 則留言
                      </Text>
                    )}
                    {post.matched_keywords.length > 0 && (
                      <div className={styles.badges}>
                        {post.matched_keywords.slice(0, 3).map((keyword) => (
                          <Badge key={`${post.id}-${keyword}`} variant='light' color='gray'>
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  )
}

export default CourseRelatedPostsPanel
