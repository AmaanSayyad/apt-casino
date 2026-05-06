import { forwardRef } from 'react'
import Lottie from "lottie-react";
import bankRaw from "./raw/lottie-bank.json";
import gameRaw from "./raw/lottie-play.json";
import communityRaw from "./raw/lottie-profile.json";
import gameHomeRaw from './raw/lottie-game-home.json';
import rouletteRaw from './raw/lottie-roulette.json';
import notFoundRaw from './raw/lottie-404.json';
import celebrateRaw from './raw/lottie-celebrate.json';
import cookieRaw from './raw/lottie-cookie.json'
/*
Home
*/

export const BankAnimation = forwardRef(function BankAnim(props, ref) {
  return <Lottie lottieRef={ref} animationData={bankRaw} {...props} />;
});

export const GameAnimation = forwardRef(function GameAnim(props, ref) {
  return <Lottie lottieRef={ref} animationData={gameRaw} {...props} />;
});

export const CommunityAnimation = forwardRef(function CommunityAnim(props, ref) {
  return <Lottie lottieRef={ref} animationData={communityRaw} {...props} />;
});


/*
Games
*/
export const GameHomeAnimation = forwardRef(function GameHomeAnim(props, ref) {
  return <Lottie lottieRef={ref} animationData={gameHomeRaw} {...props} />
});

export const RouletteAnimation = forwardRef(function RouletteAnim(props, ref) {
  return <Lottie lottieRef={ref} animationData={rouletteRaw} {...props} />
});

/*
General
*/
export const NotFoundAnimation = forwardRef(function NotFoundAnim(props, ref) {
  return <Lottie lottieRef={ref} animationData={notFoundRaw} {...props} />
});

export const CelebrateAnimation = forwardRef(function CelebrateAnim(props, ref) {
  return <Lottie lottieRef={ref} animationData={celebrateRaw} {...props} />
})

export const CookieAnimation = forwardRef(function CookieAnim(props, ref) {
  return <Lottie lottieRef={ref} animationData={cookieRaw} {...props} />
})