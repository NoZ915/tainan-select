import { Loader } from "@mantine/core";
import { useGetLatestReviews } from "../hooks/reviews/useGetLatestReiviews";
import ReviewCard from "./ReviewCard";

const LatestReviewsPanel: React.FC = () => {
	const { data: latestReivews, isLoading } = useGetLatestReviews();

	if(isLoading){
		return <Loader />
	}

	return (
		<>
			{latestReivews?.map((review) => {
				const formatCourse = { course: review.course }
				return (
					<ReviewCard review={review} course={formatCourse} />
				)
			})}
		</>
	)
}

export default LatestReviewsPanel;