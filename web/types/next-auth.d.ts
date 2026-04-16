import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    apiToken?: string;
    apiUser?: any;
  }
  interface User {
    apiToken?: string;
    apiUser?: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    apiToken?: string;
    apiUser?: any;
  }
}