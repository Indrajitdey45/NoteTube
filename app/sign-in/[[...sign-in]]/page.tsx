import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignIn
        appearance={{
          elements: {
            // Hide phone number field and its label row
            formFieldRow__phoneNumber: { display: 'none' },
            formField__phoneNumber: { display: 'none' },
            phoneInputBox: { display: 'none' },
          },
        }}
      />
    </div>
  )
}
