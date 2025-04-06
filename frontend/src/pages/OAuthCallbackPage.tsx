import { useEffect } from "react";
import { useGetAuthStatus } from "../hooks/auth/useGetAuthStatus";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Loader } from "@mantine/core";

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
    
    const redirect_path = localStorage.getItem("redirect_path");

    if(user){
      if(redirect_path){
        navigate(redirect_path);
        localStorage.removeItem("redirect_path");
      }else{
        navigate("/");
      }
    }else{
      navigate("/");
    }

  }, [location.search, navigate, user])

  return (
    <Container>
      <Loader/>
      <div>正在處理 Google 登入...</div>
    </Container>
  )
}

export default OAuthCallbackPage;