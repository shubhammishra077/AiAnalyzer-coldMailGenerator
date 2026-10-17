import React from 'react';
import LegalLayout, { Section, List } from '../components/LegalLayout';
import { COMPANY_NAME, CONTACT_EMAIL } from '../config';

const PrivacyPolicy = () => (
    <LegalLayout
        title="Privacy Policy"
        current="/privacy"
        intro={`This policy explains what personal information ${COMPANY_NAME} ("we", "us") collects when you use our website and services, why we collect it, who we share it with, and the choices you have. By using the service you confirm that you have read it.`}
    >
        <Section id="collect" title="1. Information we collect">
            <p><strong>Account information.</strong> Your name, email address and a password. Passwords are stored only as a one-way hash, never in readable form. If you sign in with Google, we receive your name, email address, Google account identifier and profile picture URL from Google. We never receive your Google password.</p>
            <p><strong>Profile information you add.</strong> For example your current role, years of experience, target role, skills, achievements and links to LinkedIn, GitHub or a portfolio.</p>
            <p><strong>Content you submit.</strong> Recruiter names, company names, job titles, job descriptions and notes you enter; and your resume, either pasted as text or uploaded as a PDF, DOCX or TXT file. When you upload a file we extract its text and keep only that text, not the original file.</p>
            <p><strong>Outreach tracking.</strong> If you use the tracker, the status you set for each email (for example sent or replied), related dates and any notes you type. We do not read your inbox or connect to your email account; these details exist only because you enter them. Notes may mention other people, such as recruiters, so keep them to what is necessary.</p>
            <p><strong>Content we generate for you.</strong> The emails, LinkedIn messages, follow-ups and resume analyses created for you. These are saved to your history so you can find them again.</p>
            <p><strong>Technical information.</strong> Our servers receive your IP address and basic request details. We use these to keep the service secure and to limit abuse (for example rate limiting). We store a sign-in token in your browser's local storage so you stay signed in.</p>
        </Section>

        <Section id="use" title="2. How we use information">
            <List items={[
                'To create and secure your account, verify your email address and let you reset your password.',
                'To generate outreach messages and resume suggestions that you request.',
                'To save and show your history, saved resume and analyses.',
                'To keep the service safe: detecting abuse, enforcing usage limits and fixing errors.',
                'To respond to your messages and to meet legal obligations.',
            ]} />
            <p>We do not sell your personal information, and we do not use it for advertising.</p>
        </Section>

        <Section id="ai" title="3. AI processing and other service providers">
            <p>To generate content, we send the relevant text to a third-party AI provider (currently Groq). That text can include your name, profile details, the recruiter, company and job details you enter, your resume text and your job description. The provider processes it to return a response under its own terms and privacy policy. We do not ask the provider to train models on your content, but we cannot control how a third party operates, so please do not submit information you are not comfortable sharing with them.</p>
            <p>We also rely on these categories of providers:</p>
            <List items={[
                'Google, for optional "Sign in with Google" and for loading fonts. Google may receive your IP address and set its own cookies under its own policy.',
                'An email delivery provider, to send verification codes and password reset links.',
                'Hosting and database providers, which store and serve the data described above on our behalf.',
            ]} />
            <p>We may also disclose information if required by law, or to protect the rights, safety and security of our users and the service.</p>
        </Section>

        <Section id="sensitive" title="4. Please keep sensitive data out">
            <p>Resumes and job descriptions can contain personal details such as phone numbers, addresses or dates of birth. Only include what you are comfortable having processed as described in this policy. Do not submit government ID numbers, financial account details, health information or anyone else's confidential information.</p>
        </Section>

        <Section id="cookies" title="5. Cookies and local storage">
            <p>We use your browser's local storage to keep you signed in. This is strictly necessary for the service to work. We do not use advertising or analytics cookies. Third-party features such as Google sign-in may set their own cookies when you use them.</p>
        </Section>

        <Section id="retention" title="6. How long we keep information">
            <p>We keep your account, profile, history, saved resume and analyses until you delete them or ask us to delete your account. You can delete individual history entries, your saved resume and your resume analyses yourself inside the app, and you can delete your whole account from your Profile page, which permanently removes your profile, history, saved resume and analyses. Accounts whose email address is never verified are removed automatically after 7 days. Short-lived security data, such as one-time codes and password reset tokens, expires automatically. Backups and logs may keep copies for a limited period after deletion.</p>
        </Section>

        <Section id="security" title="7. Security">
            <p>We protect information with measures such as password hashing, hashed one-time codes and reset tokens, request rate limiting and restricting access to your data to your own account. No online service is perfectly secure, and we cannot guarantee absolute security. Choose a strong, unique password and keep it private.</p>
        </Section>

        <Section id="rights" title="8. Your choices and rights">
            <p>Depending on where you live (for example under the GDPR or UK GDPR, or India's Digital Personal Data Protection Act, 2023), you may have the right to access your personal information, correct it, delete it, receive a copy, object to or restrict certain processing, withdraw consent, and complain to your local data protection authority.</p>
            <p>You can edit your profile, delete your content and delete your account directly in the app (Profile, then Delete account). For anything else, email us at <a className="font-medium text-primary-600 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address registered on your account. We may need to verify your identity before acting.</p>
        </Section>

        <Section id="transfers" title="9. International transfers">
            <p>Our providers may process information in countries other than your own, which may have different data protection laws. Where required, we rely on appropriate safeguards for such transfers.</p>
        </Section>

        <Section id="children" title="10. Children">
            <p>The service is intended for people aged 18 and over. We do not knowingly collect personal information from children. If you believe a child has given us information, contact us and we will delete it.</p>
        </Section>

        <Section id="changes" title="11. Changes to this policy">
            <p>We may update this policy from time to time. We will change the "Last updated" date above and, for material changes, give notice in the service or by email.</p>
        </Section>

        <Section id="contact" title="12. Contact us">
            <p>Questions or requests about privacy: <a className="font-medium text-primary-600 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
        </Section>
    </LegalLayout>
);

export default PrivacyPolicy;
