import React from 'react';
import { Link } from 'react-router-dom';
import LegalLayout, { Section, List } from '../components/LegalLayout';
import { COMPANY_NAME, CONTACT_EMAIL } from '../config';

const CopyrightPolicy = () => (
    <LegalLayout
        title="Copyright Policy"
        current="/copyright"
        intro={`This page explains who owns what on ${COMPANY_NAME}, how you may use our materials, how AI-generated output is treated, and how to report content that infringes your copyright.`}
    >
        <Section id="notice" title="1. Copyright notice">
            <p>&copy; {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</p>
            <p>The website and service, including source code, user interface, design, layout, text, graphics, icons, the {COMPANY_NAME} name and logo, and compilations of these, are owned by {COMPANY_NAME} or its licensors and are protected by copyright, trademark and other laws.</p>
        </Section>

        <Section id="use" title="2. What you may and may not do">
            <p>You may use the service for its intended purpose under our <Link to="/terms" className="font-medium text-primary-600 hover:underline">Terms of Service</Link>. Without our written permission you may not:</p>
            <List items={[
                'copy, modify, distribute, sell, lease or create derivative works from our software, design or branding;',
                'reverse engineer or attempt to extract source code, except where the law expressly allows it;',
                'scrape or systematically download the service or its content;',
                'remove or alter copyright, trademark or other proprietary notices;',
                'use our name, logo or marks in a way that suggests endorsement or affiliation.',
            ]} />
        </Section>

        <Section id="yours" title="3. Your content and AI-generated output">
            <p>You keep the rights you have in the content you submit, such as your resume and job descriptions. As between you and us, you may use the emails, messages and suggestions generated for you for any lawful purpose, including sending them as your own, and we claim no ownership of them.</p>
            <p>AI-generated text may resemble other text, and the law on whether copyright exists in AI output varies by country and is still developing. We do not guarantee that output is original or protected, or that it does not resemble someone else's work. You are responsible for reviewing it before use.</p>
            <p>Only submit material you own or have permission to use. Do not paste in someone else's copyrighted text, for example a job posting you are not allowed to copy, beyond what is reasonable for personal use.</p>
        </Section>

        <Section id="marks" title="4. Third-party names and marks">
            <p>Google, LinkedIn and other company, product and service names mentioned in the service belong to their respective owners. They are used for identification only and do not imply any affiliation with or endorsement by those owners.</p>
        </Section>

        <Section id="report" title="5. Reporting copyright infringement">
            <p>If you believe material on our service infringes your copyright, send a written notice to <a className="font-medium text-primary-600 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the subject line "Copyright notice". Please include:</p>
            <List items={[
                'a description of the copyrighted work you claim is infringed, with a link or other way to identify it;',
                'a description of the material you claim infringes it and enough detail for us to locate it (for example the page and the date);',
                'your name, postal address, telephone number and email address;',
                'a statement that you have a good-faith belief that the use is not authorised by the copyright owner, its agent or the law;',
                'a statement that the information in your notice is accurate and, under penalty of perjury, that you are the copyright owner or authorised to act for the owner;',
                'your physical or electronic signature.',
            ]} />
            <p>Notices that are incomplete may be delayed. Knowingly making a false claim of infringement can lead to legal liability.</p>
        </Section>

        <Section id="action" title="6. What we do with a notice">
            <p>When we receive a valid notice we may remove or disable access to the material and notify the user who posted it. We may forward your notice, including your contact details, to that user.</p>
        </Section>

        <Section id="counter" title="7. Counter-notice">
            <p>If your content was removed and you believe that was a mistake or that you have the right to use the material, you may reply to the same address with: identification of the material and where it appeared; a statement under penalty of perjury that you believe in good faith it was removed by mistake or misidentification; your name, address, telephone number and email; consent to the jurisdiction of the courts where you live; and your signature. If the complaining party does not tell us within a reasonable time (generally 10 to 14 business days) that it has started legal action, we may restore the material.</p>
        </Section>

        <Section id="repeat" title="8. Repeat infringers">
            <p>We may suspend or terminate the accounts of users who are repeatedly found to infringe the rights of others.</p>
        </Section>
    </LegalLayout>
);

export default CopyrightPolicy;
