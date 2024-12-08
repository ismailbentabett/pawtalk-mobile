import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  HomeTab: undefined;
  Likes: undefined;
  Messages: undefined;
  ProfileTab: undefined;
};

export type AppStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Profile: undefined;
  // Add other screen names and their params here
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

