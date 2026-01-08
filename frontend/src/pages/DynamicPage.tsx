import { Container } from '@mantine/core'
import LatestReviewsPanel from '../components/LatestReviewsPanel'
import MostPopularCoursesPanel from '../components/MostPopularCoursesPanel'

const DynamicPage: React.FC = () => {
    return(
        <Container mt='0.5rem'>
            <MostPopularCoursesPanel />
            <LatestReviewsPanel />
        </Container>
    )
}

export default DynamicPage