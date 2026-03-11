# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Welcome to TTC" [level=2] [ref=e6]
      - paragraph [ref=e7]: If you have previously created your account please enter your email address and password to sign in.
    - form "Sign in with your email address" [ref=e9]:
      - alert [ref=e10]:
        - paragraph [ref=e11]: Your username or password is incorrect or your account is locked. Please contact support for assistance.
      - generic [ref=e12]:
        - generic [ref=e13]:
          - text: Email Address 
          - textbox "Email Address" [ref=e14]: kerrie.cout@ttc-uk.com
        - generic [ref=e15]:
          - generic [ref=e16]: Password
          - text: 
          - textbox "Password" [ref=e17]: Boycie13!
          - generic [ref=e18]:
            - checkbox "Show Password" [ref=e19] [cursor=pointer]
            - generic [ref=e20]: Show Password
        - generic [ref=e21]:
          - checkbox "Keep me signed in" [ref=e22]
          - text: Keep me signed in
        - generic [ref=e23]:
          - button "Sign in" [active] [ref=e24] [cursor=pointer]
          - link "Forgot your password?" [ref=e25] [cursor=pointer]:
            - /url: /ttctrainerb2cuat.onmicrosoft.com/B2C_1_sign_in_2/api/CombinedSigninAndSignup/forgotPassword?csrf_token=NnRtUlBxMjBDVmNMYkZaSUdaS090UGVwaUZZTHUwOWNmQlB3cDRTRmlXbVVXMk1wNEQ3R1AxZ25pYlJXZWNWTW03bDVDUC9DbHNSWXpnMkw4SVFXeFE9PTsyMDI2LTAzLTExVDExOjAyOjE2LjIyMTYxN1o7NlJoL3J2cmVaa3VWUm5MdmdRd2YyZz09O3siT3JjaGVzdHJhdGlvblN0ZXAiOjF9&tx=StateProperties=eyJUSUQiOiIzY2MxNmU5ZC04ZDk1LTRmNjQtYWY4Yi1hZTY1MzlmNDY5MTUifQ&p=B2C_1_sign_in_2
  - contentinfo [ref=e26]:
    - generic [ref=e28]: © TTC Group 2026. All rights reserved.
```