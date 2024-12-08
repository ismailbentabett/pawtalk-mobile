import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Main: undefined;
};

export type BottomTabParamList = {
  HomeTab: undefined;
  ProfileTab: undefined;
};

export type AppNavigationProp = NativeStackNavigationProp<AppStackParamList>;
export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

