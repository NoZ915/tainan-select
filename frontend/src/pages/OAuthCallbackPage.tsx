import { useEffect } from "react";
import { useGetAuthStatus } from "../hooks/auth/useGetAuthStatus";
import { useLocation, useNavigate } from "react-router-dom";

const OAuthCallbackPage: React.FC = () => {
  const { data: user } = useGetAuthStatus();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const error = searchParams.get("error");

    if (error === "invalid_email") {
      navigate("/mailError"); 
      return;
    }

    if(user){
      navigate("/")
    }else{
      navigate("/")
    }
  }, [location.search, navigate, user])

  return (
    <div>正在處理 Google 登入...</div>
  )
}

export default OAuthCallbackPage;