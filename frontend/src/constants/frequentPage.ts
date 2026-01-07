import { LinkItem } from "../components/FrequentLinkCard";

export const FREQUENT_LINKS: LinkItem[] = [
  {
    id: "course-select",
    title: "南大選課官方系統",
    desc: "選課、加退選的操作入口",
    href: "https://academics.nutn.edu.tw/Course/",
    isExternal: true,
    imageSrc: "/images/frequent/course-select.png",
    imageAlt: "南大選課"
  },
  {
    id: "ecourse",
    title: "E-Course | 南大課程網站",
    desc: "找課程教材、成績（但幾乎沒出現過），或是要在 deadline 前才想到要上傳作業的地方。",
    href: "https://ecourse.nutn.edu.tw/",
    isExternal: true,
    imageSrc: "/images/frequent/ecourse.png",
    imageAlt: "E-Course"
  },
  {
    id: "student-system",
    title: "學務線上管理系統",
    desc: "偏生活相關的，像是要申請宿舍、機車位、學貸，或要請假、看有沒有被記曠課等等都來這",
    href: "https://student.nutn.edu.tw/iOSA/LogonBT.aspx",
    isExternal: true,
    imageSrc: "/images/frequent/student-system.png",
    imageAlt: "學務線上管理系統"
  },
  {
    id: "academics-system",
    title: "教務學生系統",
    desc: "跟成績、學習上有關的，想是期末看看成績、想棄選了，或想申請雙主修、下載在學證明等來這",
    href: "https://academics.nutn.edu.tw/iSTU/",
    isExternal: true,
    imageSrc: "/images/frequent/academics-system.png",
    imageAlt: "教務學生系統"
  },
  {
    id: "nutn-mail",
    title: "南大學生電子郵件系統",
    desc: "如果沒有綁定 gmail，可以來這裡收南大信箱的郵件",
    href: "https://stumail.nutn.edu.tw/cgi-bin/login?index=1",
    isExternal: true,
    imageSrc: "/images/frequent/nutn-mail.png",
    imageAlt: "南大信箱"
  },
  {
    id: "nutn-select",
    title: "TAINAN 選 | 南大課程評價",
    desc: "回到 TAINAN 選，查評價與資訊，肯定還是要推一下 :3",
    href: "/",
    isExternal: false,
    imageSrc: "/images/frequent/nutn-select.png",
    imageAlt: "TAINAN 選"
  },
  {
    id: "nutn-info-system",
    title: "南大學生資訊系統入口",
    desc: "如果上方常用連結不夠用，這裡可以找到更多連結",
    href: "https://www.nutn.edu.tw/student.html",
    isExternal: true,
    imageSrc: "/images/frequent/nutn-info-system.png",
    imageAlt: "學生資訊系統入口"
  }
];
