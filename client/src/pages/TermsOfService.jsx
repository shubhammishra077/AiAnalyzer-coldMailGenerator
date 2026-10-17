import React from 'react';
import { Link } from 'react-router-dom';
import LegalLayout, { Section, List } from '../components/LegalLayout';
import { COMPANY_NAME, CONTACT_EMAIL, GOVERNING_LAW } from '../config';

const TermsOfService = () => (
    <LegalLayout
        title="Terms of Service"
        current="/terms"
        intro={`These terms are an agreement between you and ${COMPANY_NAME} ("we", "us") and govern your use of our website and services, including AI-generated outreach messages and resume analysis. By creating an account or using the service you agree to them. If you do not agree, do not use the service.`}
    >
        <Section id="eligibility" title="1. Eligibility and accounts">
            <p>You must be at least 18 years old and able to form a binding contract. You must provide accurate information and verify your email address. You are responsible for your account, for keeping your password secure and for everything done through your account. Tell us promptly if you suspect unauthorised use.</p>
        </Section>

        <Section id="service" title="2. What the service does">
            <p>{COMPANY_NAME} uses artificial intelligence to draft cold emails, LinkedIn messages and follow-ups, and to compare your resume with a job description and suggest changes. Features may change, and we may add, limit or remove them. We may apply usage limits to keep the service reliable and fair. The service is currently free; if we introduce paid plans we will tell you before any charge applies.</p>
        </Section>

        <Section id="ai" title="3. AI output: you are responsible for what you send">
            <p>AI output can be wrong, incomplete, repetitive or unsuitable. We do not guarantee its accuracy, that it will be original, or that it will get you a reply, an interview or a job. A resume match score is an automated estimate, not a prediction of any employer's or screening system's decision.</p>
            <p>Review every draft before you use it. Check names, facts and claims. You are solely responsible for anything you send or publish.</p>
        </Section>

        <Section id="honesty" title="4. Be truthful in your applications">
            <p>Our tools are designed to work from the facts you give them. Do not use the service to invent or exaggerate qualifications, employment history, skills or results. Suggestions to add a keyword or skill apply only if you genuinely have that experience.</p>
        </Section>

        <Section id="acceptable" title="5. Acceptable use">
            <p>You agree not to:</p>
            <List items={[
                'send spam, bulk unsolicited messages or messages that break anti-spam, privacy or marketing laws that apply to you or the recipient;',
                'harass, threaten, deceive or impersonate any person or organisation;',
                'submit content that is unlawful, infringing, hateful, or that you have no right to use;',
                'upload other people\'s confidential or sensitive personal information without a lawful basis;',
                'probe, scan or test the service for vulnerabilities, bypass rate limits or access controls, or interfere with other users;',
                'scrape the service, resell it, or use automated means to generate content at scale beyond normal personal use;',
                'attempt to extract, manipulate or override the instructions given to the AI, or use the service to build a competing product.',
            ]} />
            <p>We may suspend or remove accounts and content that break these rules.</p>
        </Section>

        <Section id="outreach" title="6. Your outreach and the law">
            <p>You decide who to contact and what to send. You are responsible for complying with laws on electronic messages and data protection that apply to your outreach (for example anti-spam and privacy rules in the recipient's country) and with the terms of any platform you use, such as LinkedIn or your email provider.</p>
        </Section>

        <Section id="content" title="7. Your content">
            <p>You keep ownership of the content you submit, such as your resume, job descriptions and profile details, and of the output generated for you. You give us a limited, non-exclusive licence to host, process and display that content solely to operate and improve the reliability and security of the service for you, including sending it to the AI and infrastructure providers described in our <Link to="/privacy" className="font-medium text-primary-600 hover:underline">Privacy Policy</Link>. You confirm you have the right to submit it.</p>
        </Section>

        <Section id="ip" title="8. Our intellectual property">
            <p>The service, including its software, design, text, graphics, name and logo, belongs to {COMPANY_NAME} or its licensors and is protected by intellectual property laws. We grant you a personal, limited, revocable, non-transferable licence to use the service under these terms. See our <Link to="/copyright" className="font-medium text-primary-600 hover:underline">Copyright Policy</Link> for details and for how to report infringement.</p>
        </Section>

        <Section id="third" title="9. Third-party services">
            <p>The service relies on third parties such as Google (sign-in) and AI and hosting providers. Their services are governed by their own terms, and we are not responsible for their availability or conduct.</p>
        </Section>

        <Section id="termination" title="10. Suspension and termination">
            <p>You may stop using the service and delete your account at any time from your Profile page. We may suspend or end your access if you breach these terms, create risk or legal exposure for us or others, or if we discontinue the service. Sections that by their nature should survive termination will do so.</p>
        </Section>

        <Section id="disclaimer" title="11. Disclaimers">
            <p>The service is provided "as is" and "as available", without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, accuracy and non-infringement, to the fullest extent permitted by law. We do not warrant that the service will be uninterrupted, error-free or secure.</p>
        </Section>

        <Section id="liability" title="12. Limitation of liability">
            <p>To the fullest extent permitted by law, {COMPANY_NAME} and its owners, personnel and suppliers will not be liable for any indirect, incidental, special, consequential or punitive damages, or for lost profits, lost opportunities, lost data or damage to reputation, arising from your use of the service or AI output. Our total liability for any claim relating to the service will not exceed the greater of the amount you paid us in the 12 months before the claim or USD 50. Some jurisdictions do not allow certain limits, so parts of this section may not apply to you, and nothing here limits liability that cannot lawfully be limited.</p>
        </Section>

        <Section id="indemnity" title="13. Indemnity">
            <p>You agree to indemnify and hold us harmless from claims, losses and costs (including reasonable legal fees) arising from your content, your outreach, or your breach of these terms or of the law.</p>
        </Section>

        <Section id="law" title="14. Governing law">
            <p>These terms are governed by the laws of {GOVERNING_LAW}, without regard to conflict-of-law rules, and the courts of that jurisdiction have exclusive jurisdiction, except where mandatory consumer laws give you the right to bring a claim elsewhere.</p>
        </Section>

        <Section id="changes" title="15. Changes to these terms">
            <p>We may update these terms. We will change the "Last updated" date and, for material changes, give notice in the service or by email. Continuing to use the service after changes take effect means you accept them.</p>
        </Section>

        <Section id="contact" title="16. Contact">
            <p>Questions about these terms: <a className="font-medium text-primary-600 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
        </Section>
    </LegalLayout>
);

export default TermsOfService;
