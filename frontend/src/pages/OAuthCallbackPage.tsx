import { useEffect } from "react";
import { useGetAuthStatus } from "../hooks/auth/useGetAuthStatus";
import { useNavigate } from "react-router-dom";

const OAuthCallbackPage: React.FC = () => {
  const { data: user } = useGetAuthStatus();
  const navigate = useNavigate();

  useEffect(() => {
    if(user){
      navigate("/")
    }else{
      navigate("/")
    }
  }, [navigate, user])

  return (
    <div>正在處理 Google 登入...</div>
  )
}

export default OAuthCallbackPage;