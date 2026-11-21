```mermaid
stateDiagram-v2
  state "WSP Portal" as SystemA {
    state "Current Page" as A_Page
  }

  state "Agent Portal" as SystemB {
    state "Unauthenticated" as B_Unauth
    state "Callback Page" as B_Callback
    state "Authenticated" as B_Auth
    state "User Resolution" as B_Resolution
    state "Global Error" as B_Error
    state "Portal Page" as B_Portal
  }

  state "Microsoft Entra" as Auth0 {
    state "Session Check" as SessionCheck
    state "Universal Login" as LoginPage
    state "Authorization" as Authorization
  }

  [*] --> A_Page
  A_Page --> B_Unauth: Navigate by clicking the access link
  B_Unauth --> SessionCheck: Redirect through Auth0:OIDC
  SessionCheck --> Authorization: [Valid]
  SessionCheck --> LoginPage: [Not Valid]
  LoginPage --> Authorization: Login successful
  Authorization --> B_Callback: Redirect with Authorization Code
  B_Callback --> B_Auth: Obtain tokens by Exchanging Code
  B_Auth --> B_Resolution: Match & Load customer by external reference
  B_Resolution --> B_Portal: [Matched] Redirect
  B_Resolution --> B_Error: [Not Matched]
  B_Error --> [*]
  B_Portal --> [*]