import { ActionIcon, Avatar, Box, Card, Container, Group, Menu, Rating, Text } from "@mantine/core";
import { BsThreeDots } from "react-icons/bs";
import { FaEdit } from "react-icons/fa";
import { RiDeleteBin6Fill } from "react-icons/ri";
import styles from "../styles/components/CourseReviewsPanel.module.css";
import { ReviewsResponse } from "../types/reviewType";
import { Course } from "../types/courseType";

interface CourseReviewsPanelProps {
  course: { course: Course } | null | undefined;
  reviews: ReviewsResponse[] | undefined;
  isLoading: boolean;
}

const CourseReviewsPanel: React.FC<CourseReviewsPanelProps> = ({ course, reviews, isLoading }) => {
  if (isLoading) {
    return <>Is Loading...</>
  }

  if (!reviews) {
    return <>There are no reviews.</>;
  }

  return (
    <Container className={styles.container}>
      {reviews.map((review) => {
        return (
          <Card key={review.id} className={styles.card}>
            <Card.Section className={styles.cardSection}>
              <Group justify="space-between">
                <Group>
                  <Avatar variant="light" size="lg" color="brick-red.6" src="" />
                  <Box>
                    <Text>{review.UserModel.name}</Text>
                    <Text>{new Date(review.updated_at).toLocaleString()}</Text>
                  </Box>
                </Group>
                {review.is_owner && (
                  <Menu>
                    <Menu.Target>
                      <ActionIcon variant="fullfill" size="lg" radius="xs">
                        <BsThreeDots size={16} />
                      </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown className={styles.dropdown}>
                      <Menu.Item
                        leftSection={<FaEdit size={16} />}
                        classNames={{ itemLabel: styles.itemLabel }}
                      >
                        編輯
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<RiDeleteBin6Fill size={16} />}
                        classNames={{ itemLabel: styles.itemLabel }}
                        color="red"
                      >
                        刪除
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                )}
              </Group>

            </Card.Section>

            <Card.Section className={styles.cardSection}>
              <Text size="md" fw={900} className={styles.courseName}>
                {course?.course.course_name} / {course?.course.instructor}
              </Text>
            </Card.Section>

            <Card.Section className={styles.cardSection}>
              <Group>
                <Text>收穫</Text>
                <Rating defaultValue={review.gain} color="brick-red.6" size="md" fractions={2} readOnly></Rating>

                <Text>甜度</Text>
                <Rating defaultValue={review.sweetness} color="brick-red.6" size="md" fractions={2} readOnly></Rating>

                <Text>涼度</Text>
                <Rating defaultValue={review.coolness} color="brick-red.6" size="md" fractions={2} readOnly></Rating>
              </Group>
            </Card.Section>

            <Card.Section className={styles.cardSection}>
              <Text>{review.comment}</Text>
            </Card.Section>
          </Card>
        )
      })}
    </Container>
  )
}

export default CourseReviewsPanel;