import { Container } from '@mantine/core'
import LatestReviewsPanel from '../components/LatestReviewsPanel'
import PlatformStatsPanel from '../components/PlatformStatsPanel'

const DynamicPage: React.FC = () => {
    return(
        <Container mt='0.5rem'>
            <PlatformStatsPanel />
            <LatestReviewsPanel />
        </Container>
    )
}

export default DynamicPage