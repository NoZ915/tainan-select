import periodTimeMap from "./periodTimeMap";
import React from "react";

const formatCourseTime = (courseTime?: string): React.ReactNode => {
	if(!courseTime) return courseTime;
	
  // 格式為「星期X，節次6、7」
  const match = courseTime.match(/^(.+?)，節次(.+)$/);
  if (!match) return courseTime;

	// 可利用正規分別取match[0], match[1], match[2]
	// match[0]為整串, match[1]為(.+?)match到的字串, match[2]為(.+)match到的字串
  const periodsStr = match[2]; 
  const periods = periodsStr.split("、").map((p) => p.trim());

  const times = periods.map((p) => periodTimeMap[p]).filter(Boolean);
  if (times.length === 0) return courseTime;

  return (
    <>
      {courseTime}
      <br />
      ({times.join("、")})
    </>
  );
};

export default formatCourseTime;
