import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'
import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { questionsData } from '@/lib/questions';
import { computeAssessment } from '@/lib/scoring';
import { google } from 'googleapis';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { db } from '@/lib/db';
import { formatAnswerValue } from '@/lib/submission-format';

// Define the structure of the request body
interface AssessmentData {
  personalInfo: {
    name: string;
    email: string;
    company: string;
    position: string;
    phone?: string;
    website?: string;
  };
  answers: Record<string, string>;
  score?: number;
  assessment?: any;
}

interface PersonalInfo {
  name: string;
  email: string;
  company: string;
  position: string;
  phone?: string;
  website?: string;
}


// Create styles for the PDF
const createStyles = () => StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#757574',
    position: 'relative',
  },
  fullPageImageContainer: {
    width: 595.28, // A4 width in points
    height: 841.89, // A4 height in points
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPageImage: {
    width: 595.28, // A4 width in points
    height: 841.89, // A4 height in points
  },
  letterheadHeader: {
    backgroundColor: '#009CD9',
    paddingTop: 20,
    paddingBottom: 15,
    paddingLeft: 40,
    paddingRight: 40,
    marginBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  logo: {
    width: 80,
    height: 40,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 3,
    textAlign: 'left',
  },
  companyTagline: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'left',
  },
  managingPartner: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'left',
    fontStyle: 'italic',
  },
  headerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#ffffff',
    borderTopStyle: 'solid',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'left',
  },
  documentDate: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'right',
  },
  contentArea: {
    padding: 40,
    // Keep enough space for the top-right logo, but avoid subtle overflow
    // that can cause @react-pdf/renderer to insert an extra (often blank) page.
    paddingTop: 70,
    paddingBottom: 30,
    flex: 1,
  },
  // Use a tighter top padding on subsequent pages to avoid occasional blank-page layout issues
  // in @react-pdf/renderer when table blocks are close to the page height.
  contentAreaTight: {
    padding: 40,
    paddingTop: 60,
    paddingBottom: 30,
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D9C2D',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#2D9C2D',
    borderBottomStyle: 'solid',
    textAlign: 'left',
  },
  personalInfoCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#009CD9',
    borderLeftStyle: 'solid',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#757574',
    width: '25%',
    textAlign: 'left',
  },
  infoValue: {
    fontSize: 11,
    color: '#2D9C2D',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'left',
  },
  scoreContainer: {
    backgroundColor: '#f0f9ff',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#009CD9',
    borderStyle: 'solid',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#757574',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2D9C2D',
    marginBottom: 20,
  },
  percentageContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#009CD9',
    borderTopStyle: 'solid',
    alignItems: 'center',
    width: '100%',
  },
  percentageLabel: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  percentageValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#009CD9',
  },
  gaugeContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  gaugeOuter: {
    width: 200,
    height: 120,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeSemiCircle: {
    width: 200,
    height: 100,
    borderTopWidth: 8,
    borderTopColor: '#ef4444',
    borderLeftWidth: 8,
    borderLeftColor: '#ef4444',
    borderRightWidth: 8,
    borderRightColor: '#22c55e',
    borderRadius: 100,
    borderBottomWidth: 0,
    position: 'relative',
  },
  gaugeNeedle: {
    position: 'absolute',
    width: 2,
    height: 80,
    backgroundColor: '#1E293B',
    top: 20,
    left: 99,
  },
  gaugeCenter: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    top: 100,
    left: 92,
  },
  gaugePercentageText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 10,
    textAlign: 'center',
  },
  gaugeLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  gaugeLabel: {
    fontSize: 9,
    color: '#1E293B',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#009CD9',
    textAlign: 'center',
    lineHeight: 1.4,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#009CD9',
    borderStyle: 'solid',
  },
  questionsTableContainer: {
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#009CD9',
    borderStyle: 'solid',
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionsTableContainerPageBreak: {
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#009CD9',
    borderStyle: 'solid',
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionsTable: {
    marginTop: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2D9C2D',
    borderRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#009CD9',
    borderBottomStyle: 'solid',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 12,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#ffffff',
    borderRightStyle: 'solid',
  },
  tableHeaderCellLast: {
    flex: 1,
    padding: 12,
    textAlign: 'left',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    borderBottomStyle: 'solid',
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    borderBottomStyle: 'solid',
    backgroundColor: '#f8f9fa',
  },
  tableRowLast: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  tableRowAltLast: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  tableCell: {
    flex: 1,
    padding: 12,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#e5e5e5',
    borderRightStyle: 'solid',
  },
  tableCellLast: {
    flex: 1,
    padding: 12,
    textAlign: 'left',
  },
  tableCellText: {
    fontSize: 10,
    color: '#757574',
    lineHeight: 1.4,
  },
  letterheadFooter: {
    backgroundColor: '#757574',
    padding: 15,
    paddingLeft: 40,
    paddingRight: 40,
    marginTop: 'auto',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 9,
    color: '#ffffff',
    textAlign: 'left',
    lineHeight: 1.3,
  },
  footerDescription: {
    fontSize: 8,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'left',
    lineHeight: 1.2,
    fontStyle: 'italic',
  },
  disclaimerSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#009CD9',
    borderLeftStyle: 'solid',
  },
  disclaimerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1b3a57',
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 9,
    color: '#757574',
    lineHeight: 1.5,
    textAlign: 'left',
  },
  disclaimerTextBottom: {
    fontSize: 7,
    color: '#757574',
    lineHeight: 1.5,
    textAlign: 'left',
    marginTop: 3,
    paddingTop: 3,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderTopStyle: 'solid',
  },
  letterHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 30,
    paddingRight: 40,
    paddingBottom: 20,
  },
  letterLogo: {
    width: 100,
    height: 85,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 40,
    paddingTop: 90,
    paddingBottom: 30,
  },
  reportHeaderLeft: {
    flex: 1,
    paddingRight: 20,
  },
  reportHeaderRight: {
    flex: 1,
    paddingLeft: 20,
    alignItems: 'flex-end',
  },
  reportHeaderRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  reportHeaderLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#757574',
  },
  reportHeaderValue: {
    fontSize: 10,
    color: '#757574',
  },
  reportHeaderCompanyName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#757574',
    marginBottom: 8,
    textAlign: 'right',
  },
  reportHeaderContact: {
    fontSize: 10,
    color: '#757574',
    marginBottom: 3,
    textAlign: 'right',
    lineHeight: 1.4,
  },
  pageLogoHeader: {
    position: 'absolute',
    top: 20,
    right: 40,
    zIndex: 10,
  },
  pageLogo: {
    width: 100,
    height: 85,
  },
  letterContent: {
    padding: 40,
    paddingTop: 20,
    flex: 1,
  },
  letterGreeting: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 15,
    lineHeight: 1.6,
  },
  letterSubject: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 20,
    lineHeight: 1.6,
    fontWeight: 'bold',
  },
  letterBody: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 15,
    lineHeight: 1.8,
    textAlign: 'left',
  },
  letterClosing: {
    fontSize: 11,
    color: '#757574',
    marginTop: 5,
    marginBottom: 10,
    lineHeight: 1.6,
  },
  letterSignature: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 5,
    lineHeight: 1.6,
  },
  signatureName: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 5,
    lineHeight: 1.6,
  },
  signatureCompany: {
    fontSize: 11,
    color: '#757574',
    marginBottom: 25,
    lineHeight: 1.6,
  },
  letterFooter: {
    fontSize: 9,
    color: '#757574',
    marginTop: 15,
    lineHeight: 1.5,
    textAlign: 'left',
  },
  letterFooterBold: {
    fontSize: 9,
    color: '#757574',
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 2,
    lineHeight: 1.5,
    textAlign: 'left',
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
  },
  disclaimerTextInline: {
    fontSize: 9,
    color: '#757574',
    lineHeight: 1.5,
    textAlign: 'left',
    flex: 1,
    paddingRight: 10,
  },
  disclaimerImage: {
    width: 180,
    height: 60,
    marginLeft: 10,
  },
});

// Helper function to generate PDF buffer
async function generatePDFBuffer(
  personalInfo: PersonalInfo,
  answers: Record<string, string>
): Promise<Buffer> {
  const styles = createStyles();
  const currentQuestions = questionsData;
  const assessment = computeAssessment(answers);

  const createDocument = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const currentDate = `${day}-${month}-${year}`;
    
    const allAnswers = Object.entries(answers);
    // Keep the first page comfortably within A4 height to avoid an extra blank page.
    const questionsPerThirdPage = 5; // First page: Summary + first set of Q&As
    const questionsPerPage = 15; // For subsequent pages
    const questionChunksRaw: [string, string][][] = [];
    
    // First chunk: first set of questions (rendered on the first page)
    if (allAnswers.length > 0) {
      questionChunksRaw.push(allAnswers.slice(0, questionsPerThirdPage));
    }
    
    // Remaining chunks: rest of the questions
    for (let i = questionsPerThirdPage; i < allAnswers.length; i += questionsPerPage) {
      questionChunksRaw.push(allAnswers.slice(i, i + questionsPerPage));
    }

    // Defensive: never render a page for an empty chunk (can lead to a blank page in some renderers)
    const questionChunks = questionChunksRaw.filter((chunk) => chunk.length > 0);
    
    const createQuestionRows = (answersChunk: [string, string][], isLastPage = false) => {
      return answersChunk.map(([questionId, answerValue]: [string, string], index: number) => {
        const question = currentQuestions.find((q) => q.id === questionId);
        let displayAnswer = '';

        if (question) {
          if (question.responseType === 'yesno' || question.responseType === 'select') {
            const answer = question.options?.find((opt) => opt.value === answerValue);
            displayAnswer = answer?.label || answerValue || 'Not answered';
          } else if (question.responseType === 'multiselect') {
            const selectedValues = (answerValue || '').split(',').map(v => v.trim()).filter(Boolean);
            displayAnswer = selectedValues
              .map((val) => question.options?.find((opt) => opt.value === val)?.label || val)
              .join(', ') || 'Not answered';
          } else if (question.responseType === 'ynlist') {
            try {
              const ynAnswers = JSON.parse(answerValue as string);
              displayAnswer = Object.entries(ynAnswers)
                .map(([key, val]) => {
                  const option = question.options?.find(opt => opt.value === key);
                  return `${option?.label || key}: ${val}`;
                })
                .join('; ') || 'Not answered';
            } catch {
              displayAnswer = answerValue || 'Not answered';
            }
          } else {
            // text, number, etc
            displayAnswer = answerValue || 'Not answered';
          }
        } else {
          displayAnswer = answerValue || 'Not answered';
        }

        const globalIndex = allAnswers.findIndex(([id]) => id === questionId);
        const isLastRow = isLastPage && index === answersChunk.length - 1;
        const rowStyle = isLastRow 
          ? (globalIndex % 2 === 0 ? styles.tableRowLast : styles.tableRowAltLast)
          : (globalIndex % 2 === 0 ? styles.tableRow : styles.tableRowAlt);
        const cellStyle = isLastRow ? styles.tableCellLast : styles.tableCell;
        
        return React.createElement(View, { key: questionId, style: rowStyle },
          React.createElement(View, { style: cellStyle },
            React.createElement(Text, { style: styles.tableCellText }, question?.text || 'Unknown question')
          ),
          React.createElement(View, { style: styles.tableCellLast },
            React.createElement(Text, { style: styles.tableCellText }, displayAnswer)
          )
        );
      });
    };

    const pages = [];
    
    // Second page: Letter format - COMMENTED OUT FOR NOW (will be added back later)
    /*
    pages.push(
      React.createElement(Page, { size: "A4", style: styles.page },
        React.createElement(View, { style: styles.pageLogoHeader },
          React.createElement(Image, {
            style: styles.pageLogo,
            src: "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM-Kuwait/RSM%20Logo%20-%20Color.png"
          })
        ),
        React.createElement(View, { style: styles.reportHeader },
          React.createElement(View, { style: styles.reportHeaderLeft },
            React.createElement(View, { style: styles.reportHeaderRow },
              React.createElement(Text, { style: styles.reportHeaderLabel }, "Date: "),
              React.createElement(Text, { style: styles.reportHeaderValue }, currentDate)
            ),
            React.createElement(View, { style: styles.reportHeaderRow },
              React.createElement(Text, { style: styles.reportHeaderLabel }, "Name: "),
              React.createElement(Text, { style: styles.reportHeaderValue }, personalInfo.name)
            ),
            React.createElement(View, { style: styles.reportHeaderRow },
              React.createElement(Text, { style: styles.reportHeaderLabel }, "Position: "),
              React.createElement(Text, { style: styles.reportHeaderValue }, personalInfo.position)
            ),
            React.createElement(View, { style: styles.reportHeaderRow },
              React.createElement(Text, { style: styles.reportHeaderLabel }, "Company Name: "),
              React.createElement(Text, { style: styles.reportHeaderValue }, personalInfo.company)
            )
          ),
          React.createElement(View, { style: styles.reportHeaderRight },
            React.createElement(Text, { style: styles.reportHeaderCompanyName }, "RSM Albazie Consulting W.L.L."),
            React.createElement(Text, { style: styles.reportHeaderContact }, "Arraya Tower 2, Floors 41 & 42"),
            React.createElement(Text, { style: styles.reportHeaderContact }, "Abdulaziz Hamad Alsaqar St., Sharq"),
            React.createElement(Text, { style: styles.reportHeaderContact }, "P.O. Box 2115, Safat 13022, State of Kuwait"),
            React.createElement(Text, { style: styles.reportHeaderContact }, "T: +965 22961000"),
            React.createElement(Text, { style: styles.reportHeaderContact }, "F: +965 22412761"),
            React.createElement(Text, { style: styles.reportHeaderContact }, "www.rsm.global/kuwait")
          )
        ),
        React.createElement(View, { style: styles.letterContent },
          React.createElement(Text, { style: styles.letterGreeting },
            `Dear ${personalInfo.name},`
          ),
          React.createElement(Text, { style: styles.letterSubject },
            `Subject: Abridged E-invoicing Self-Assessment Report - ${personalInfo.company}`
          ),
          React.createElement(Text, { style: styles.letterBody },
            "We would like to thank you for your participation in completing the E-invoicing self-assessment questionnaire. This report is auto generated by the assessment platform, based solely on the responses provided by you. The results are shared as is, without validation, verification, or independent testing and review by our team."
          ),
          React.createElement(Text, { style: styles.letterBody },
            "We believe that this report will assist you in providing high level insights into your organization's E-invoicing compliance preparedness and provide areas for improvement as you continue your journey in adopting this framework. This report is intended solely for the use of management and sharing should be limited only to authorized personnel in your organization."
          ),
          React.createElement(Text, { style: styles.letterBody },
            "Please do not hesitate to contact us if you have any questions or would like to schedule a session on the outcome of this report with our cybersecurity team."
          ),
          React.createElement(Text, { style: styles.letterClosing },
            "Thanking You,"
          ),
          React.createElement(Text, { style: styles.signatureName },
            "Bhaskar Maheshwari"
          ),
          React.createElement(Text, { style: styles.signatureCompany },
            "RSM Albazie Consulting W.L.L."
          ),
          React.createElement(Text, { style: styles.letterFooterBold },
            "THE POWER OF BEING UNDERSTOOD"
          ),
          React.createElement(Text, { style: styles.letterFooterBold },
            "ASSURANCE | TAX | CONSULTING"
          ),
          React.createElement(View, { style: styles.disclaimerContainer },
            React.createElement(Text, { style: styles.disclaimerTextInline },
              "RSM Albazie Consulting W.L.L. is a member of the RSM network and trades as RSM. RSM is the trading name used by the members of the RSM network. Each member of the RSM network is an independent accounting and consulting firm which practices in its own right. The RSM network is not itself a separate legal entity in any jurisdiction."
            ),
            React.createElement(Image, {
              style: styles.disclaimerImage,
              src: "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM-Kuwait/Screenshot%202026-01-06%20at%207.05.31%20PM.png"
            })
          )
        )
      )
    );
    */

    // First page: Assessment Summary and Assessment Details (Second page when letter section is enabled)
    const firstChunk = questionChunks[0] || [];
    const remainingChunks = questionChunks.slice(1);
    
    pages.push(
      React.createElement(Page, { size: "A4", style: styles.page },
        React.createElement(View, { style: styles.pageLogoHeader },
          React.createElement(Image, {
            style: styles.pageLogo,
            src: "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM-Kuwait/RSM%20Logo%20-%20Color.png"
          })
        ),
        React.createElement(View, { style: styles.contentArea },
          React.createElement(View, { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Assessment Summary"),
            React.createElement(View, { style: styles.scoreContainer },
              React.createElement(Text, { style: styles.scoreLabel }, "Total Score"),
              React.createElement(Text, { style: styles.scoreValue }, `${assessment.totalScore.toString()}`),
              React.createElement(Text, { style: styles.resultText }, `Axis A (Urgency): ${assessment.urgency.score} / ${assessment.maxUrgencyScore} · ${assessment.urgency.category}`),
              React.createElement(Text, { style: styles.resultText }, `Axis B (Complexity): ${assessment.complexity.score} / ${assessment.maxComplexityScore} · ${assessment.complexity.category}`),
            )
          ),
          React.createElement(View, { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Assessment Details"),
            React.createElement(View, { style: styles.questionsTableContainer },
              React.createElement(View, { style: styles.questionsTable },
                React.createElement(View, { style: styles.tableHeader },
                  React.createElement(View, { style: styles.tableHeaderCell },
                    React.createElement(Text, { style: styles.tableHeaderText }, "Question")
                  ),
                  React.createElement(View, { style: styles.tableHeaderCellLast },
                    React.createElement(Text, { style: styles.tableHeaderText }, "Response")
                  )
                ),
                ...createQuestionRows(firstChunk, remainingChunks.length === 0)
              )
            )
          ),
          remainingChunks.length === 0 ? React.createElement(View, { style: styles.section },
            React.createElement(Text, { style: styles.disclaimerTextBottom },
              "Disclaimer: This is not a comprehensive E-invoicing assessment. This assessment only consists of about 15 questions to quickly assess a few key requirements of the E-invoicing framework. This assessment does not guarantee the detection of all existing or potential vulnerabilities and compliance gaps. It reflects the organization's compliance posture at the time of testing solely based on your responses to the assessment questions. The assessment report is intended solely for your internal use and must not be distributed, disclosed, or relied upon by third parties. RSM shall not be liable for any losses, damages, claims, or expenses arising from, or in connection with, the use of the assessment results."
            )
          ) : null
        )
      )
    );

    // Add remaining question pages starting from second page (first page is summary+details; when letter section is enabled, it becomes third page)
    remainingChunks.forEach((chunk, chunkIndex) => {
      const isLastChunk = chunkIndex === remainingChunks.length - 1;

      pages.push(
        React.createElement(Page, { size: "A4", style: styles.page },
          React.createElement(View, { style: styles.pageLogoHeader },
            React.createElement(Image, {
              style: styles.pageLogo,
              src: "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM-Kuwait/RSM%20Logo%20-%20Color.png"
            })
          ),
          React.createElement(View, { style: styles.contentAreaTight },
            React.createElement(View, { style: styles.section },
              React.createElement(View, { 
                style: styles.questionsTableContainerPageBreak 
              },
                React.createElement(View, { style: styles.questionsTable },
                  ...createQuestionRows(chunk, isLastChunk)
                )
              )
            ),
            isLastChunk ? React.createElement(View, { style: styles.section },
              React.createElement(Text, { style: styles.disclaimerTextBottom },
                "Disclaimer: This is not a comprehensive E-invoicing assessment. This assessment only consists of about 15 questions to quickly assess a few key requirements of the E-invoicing framework. This assessment does not guarantee the detection of all existing or potential vulnerabilities and compliance gaps. It reflects the organization's compliance posture at the time of testing solely based on your responses to the assessment questions. The assessment report is intended solely for your internal use and must not be distributed, disclosed, or relied upon by third parties. RSM shall not be liable for any losses, damages, claims, or expenses arising from, or in connection with, the use of the assessment results."
              )
            ) : null
          )
        )
      );
    });

    return React.createElement(Document, {}, ...pages);
  };

  // Generate PDF buffer - use blob() method and convert to Buffer
  const pdfDoc = pdf(createDocument());
  const blob = await pdfDoc.toBlob();
  
  // Convert Blob to Buffer
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Helper function to convert column number to letter (e.g., 1 -> A, 27 -> AA)
function columnToLetter(column: number): string {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

// Function to upload PDF to S3
async function uploadPDFToS3(
  pdfBuffer: Buffer,
  companyName: string,
  personalInfo: PersonalInfo
): Promise<string | null> {
  try {
    // Check if S3 credentials are available
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_REGION) {
      console.error('AWS S3 credentials or bucket name not configured');
      return null;
    }

    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `e-invoicing-assessments/${sanitizedCompanyName}_${timestamp}_${personalInfo.email.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: filename,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ACL: 'private', // or 'public-read' if you want public access
    });

    await s3Client.send(command);

    // Generate the S3 URL
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
    
    console.log('Successfully uploaded PDF to S3:', s3Url);
    console.log('S3 Upload - Bucket:', process.env.AWS_S3_BUCKET_NAME, 'Region:', process.env.AWS_REGION, 'Key:', filename);
    return s3Url;
  } catch (error: any) {
    console.error('Error uploading PDF to S3:', error);
    return null;
  }
}

// Function to write assessment data to Google Sheets
async function writeToGoogleSheets(
  personalInfo: PersonalInfo,
  answers: Record<string, string>,
  score: number,
  pdfS3Url?: string | null
) {
  try {
    // Check if credentials are available
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
      console.error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable is not set');
      return;
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      console.error('GOOGLE_SHEETS_SPREADSHEET_ID (or GOOGLE_SHEET_ID) environment variable is not set');
      return;
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const sheetName = 'Sheet1'; // Change if your sheet has a different name

    // Get current questions
    const currentQuestions = questionsData;

    // Prepare headers
    const assessment = computeAssessment(answers);
    const headers = [
      'Timestamp',
      'Name',
      'Email',
      'Company',
      'Position',
      'Total Score',
      'Axis A (Urgency) Score',
      'Axis A Category',
      'Axis B (Complexity) Score',
      'Axis B Category',
      'Eligible',
      'PDF S3 Link',
      ...currentQuestions.map(q => `Q${q.id.replace('q', '')} - ${q.text.substring(0, 50)}...`),
    ];

    const lastColumnLetter = columnToLetter(headers.length);
    const headerRange = `${sheetName}!A1:${lastColumnLetter}1`;

    // Check if headers exist, if not, add them
    try {
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: headerRange,
      });

      // If no headers exist, add them
      if (!headerResponse.data.values || headerResponse.data.values.length === 0) {
        console.log('No headers found, adding new headers');
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: headerRange,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
      } else {
        // Update headers if they don't match (in case questions changed or new columns added)
        const existingHeaders = headerResponse.data.values[0];
        const headersMatch = existingHeaders.length === headers.length && 
                             JSON.stringify(existingHeaders) === JSON.stringify(headers);
        
        if (!headersMatch) {
          console.log('Headers mismatch detected. Existing:', existingHeaders.length, 'New:', headers.length);
          console.log('Updating headers to include PDF S3 Link column');
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: headerRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [headers],
            },
          });
        } else {
          console.log('Headers match, no update needed');
        }
      }
    } catch (error) {
      // If sheet doesn't exist or error, try to create headers
      console.error('Error checking/updating headers:', error);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: headerRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
    }

    // Prepare row data
    const timestamp = new Date().toISOString();
    const rowData = [
      timestamp,
      personalInfo.name,
      personalInfo.email,
      personalInfo.company,
      personalInfo.position,
      assessment.totalScore.toString(),
      assessment.urgency.score.toString(),
      assessment.urgency.category,
      assessment.complexity.score.toString(),
      assessment.complexity.category,
      assessment.eligible ? 'Yes' : 'No',
      pdfS3Url || '',
      ...currentQuestions.map(q => {
        const answerValue = answers[q.id] || '';
        let displayValue = '';
        
        if (q.responseType === 'yesno' || q.responseType === 'select') {
          const answer = q.options?.find(opt => opt.value === answerValue);
          displayValue = answer ? answer.label : answerValue || '';
        } else if (q.responseType === 'ynlist') {
          try {
            const ynAnswers = JSON.parse(answerValue);
            displayValue = Object.entries(ynAnswers)
              .map(([key, val]) => {
                const option = q.options?.find(opt => opt.value === key);
                return `${option?.label || key}: ${val}`;
              })
              .join('; ');
          } catch {
            displayValue = answerValue || '';
          }
        } else if (q.responseType === 'multiselect') {
          const selectedValues = answerValue.split(',').filter(v => v);
          displayValue = selectedValues
            .map(val => {
              const option = q.options?.find(opt => opt.value === val);
              return option ? option.label : val;
            })
            .join(', ');
        } else {
          // text, number, or other types - use value directly
          displayValue = answerValue || '';
        }
        
        return displayValue;
      }),
    ];

    console.log('Writing to Google Sheets - PDF S3 URL:', pdfS3Url || 'Not available');
    console.log('Row data length:', rowData.length, 'Headers length:', headers.length);

    // Append the new row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:${lastColumnLetter}`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowData],
      },
    });

    console.log('Successfully wrote assessment data to Google Sheets');
  } catch (error: any) {
    console.error('Error writing to Google Sheets:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      response: error?.response?.data,
    });
    // Don't throw error - we don't want to fail the email sending if sheets write fails
  }
}

async function createAssessmentSubmission(
  personalInfo: PersonalInfo,
  answers: Record<string, string>,
) {
  const assessment = computeAssessment(answers);

  return db.assessmentSubmission.create({
    data: {
      name: personalInfo.name,
      email: personalInfo.email,
      company: personalInfo.company,
      position: personalInfo.position,
      phone: personalInfo.phone || null,
      website: personalInfo.website || null,
      totalScore: assessment.totalScore,
      urgencyScore: assessment.urgency.score,
      urgencyCategory: assessment.urgency.category,
      complexityScore: assessment.complexity.score,
      complexityCategory: assessment.complexity.category,
      eligible: assessment.eligible,
      answers,
    },
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { personalInfo, answers } = req.body as AssessmentData
  if (
    !personalInfo?.name ||
    !personalInfo?.email ||
    !personalInfo?.company ||
    !personalInfo?.position ||
    !answers ||
    typeof answers !== 'object'
  ) {
    return res.status(400).json({ message: 'Missing required assessment fields.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(personalInfo.email)) {
    console.error('Invalid email address:', personalInfo.email);
    return res.status(400).json({ message: 'Invalid email address provided.' });
  }

  const assessment = computeAssessment(answers);
  const currentQuestions = questionsData;

  // Prepare email content with HTML formatting
  const emailContent = `
    <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333;
            direction: ltr;
          }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; text-align: center; }
          .score { font-size: 24px; font-weight: bold; color: #27ae60; text-align: center; }
          .section { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f2f2f2; }
          .logo { display: block; margin: 0 auto; max-width: 200px; background: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="https://cdn-nexlink.s3.us-east-2.amazonaws.com/rsm-international-vector-logo_2-removebg-preview_5f53785d-2f5c-421e-a976-6388f78a00f2.png" alt="RSM Logo" class="logo">
          <h1>E-Invoicing Assessment - UAE</h1>
          <div class="section">
            <table>
              <tr>
                <th colspan="2">Personal Information</th>
              </tr>
              <tr>
                <td><strong>Name:</strong></td>
                <td>${personalInfo.name}</td>
              </tr>
              <tr>
                <td><strong>Email:</strong></td>
                <td>${personalInfo.email}</td>
              </tr>
              <tr>
                <td><strong>Company:</strong></td>
                <td>${personalInfo.company}</td>
              </tr>
              <tr>
                <td><strong>Position:</strong></td>
                <td>${personalInfo.position}</td>
              </tr>
            </table>
          </div>
          <div class="section">
            <h2 class="score">Total Score: ${assessment.totalScore}</h2>
            <p style="text-align:center;margin:8px 0 0 0;">
              <strong>Axis A (Urgency):</strong> ${assessment.urgency.score} / ${assessment.maxUrgencyScore} — ${assessment.urgency.category}<br/>
              <strong>Axis B (Complexity):</strong> ${assessment.complexity.score} / ${assessment.maxComplexityScore} — ${assessment.complexity.category}
            </p>
          </div>
          <div class="section">
            <table>
              <tr>
                <th>Question</th>
                <th>Subject</th>
                <th>Answer</th>
              </tr>
              ${Object.entries(answers).map(([questionId, answerValue]) => {
                const question = currentQuestions.find(q => q.id === questionId);
                const displayAnswer = formatAnswerValue(questionId, answerValue as string);
                
                return `
                  <tr>
                    <td>${question?.text || 'Unknown question'}</td>
                    <td>${question?.subject || 'N/A'}</td>
                    <td>${displayAnswer}</td>
                  </tr>
                `;
              }).join('')}
            </table>
          </div>
        </div>
      </body>
    </html>
  `

  let userEmailSent = false;
  
  try {
    console.log('Starting assessment processing for:', personalInfo.email, personalInfo.company);

    const submission = await createAssessmentSubmission(personalInfo, answers);
    console.log('Assessment submission saved to Postgres');

    // Generate PDF buffer
    console.log('Generating PDF buffer...');
    const pdfBuffer = await generatePDFBuffer(personalInfo, answers);
    console.log('PDF buffer generated successfully, size:', pdfBuffer.length, 'bytes');

    // Upload PDF to S3
    console.log('Starting S3 upload for company:', personalInfo.company);
    const pdfS3Url = await uploadPDFToS3(pdfBuffer, personalInfo.company, personalInfo);
    console.log('S3 upload result:', pdfS3Url ? 'Success' : 'Failed', pdfS3Url || '');
    if (pdfS3Url) {
      await db.assessmentSubmission.update({
        where: { id: submission.id },
        data: { pdfS3Url },
      });
    }

    // Prepare user email content with appointment booking information
    const userEmailContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your RSM E-Invoicing Assessment Report</title>
          <style>
              /* Resets and Core Styles */
              body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
              table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
              img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
              body { margin: 0; padding: 0; background-color: #ffffff; font-family: Helvetica, Arial, sans-serif; color: #333333; }
              
              /* RSM Color Palette */
              .rsm-blue { color: #00153D; }
              .bg-rsm-blue { background-color: #00153D; }
              .bg-light-gray { background-color: #f4f4f4; }
              
              /* Components */
              .container { width: 100%; max-width: 600px; margin: 0 auto; }
              .rounded-block { border-radius: 16px; overflow: hidden; }
              .attachment-badge { background-color: #eef2f6; color: #009cde; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; display: inline-block; border: 1px solid #ccdbe8; }
              
              /* Typography */
              h1 { font-size: 32px; font-weight: bold; margin: 0 0 20px 0; color: #009cde; line-height: 1.2; }
              h2 { font-size: 20px; font-weight: bold; margin: 0 0 15px 0; color: #009cde; }
              h3 { font-size: 18px; font-weight: bold; margin: 0 0 10px 0; color: #ffffff; }
              p { font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; }
              
              /* List Items in Grey Box */
              .list-title { font-size: 16px; font-weight: bold; color: #3f9c35; margin-bottom: 4px; }
              .list-desc { font-size: 15px; color: #555555; line-height: 1.5; margin: 0; }
              
              .disclaimer { font-size: 12px; color: #777777; line-height: 1.5; }
              .footer-text { font-size: 12px; color: #999999; line-height: 1.5; }

              /* Buttons */
              .btn-primary { display: inline-block; padding: 14px 30px; background-color: #00153D; color: #ffffff !important; text-decoration: none; font-weight: bold; border-radius: 30px; font-size: 16px; text-align: center; }
              .btn-secondary { display: inline-block; padding: 12px 24px; background-color: #ffffff; color: #009cde !important; text-decoration: none; font-weight: bold; border-radius: 30px; font-size: 14px; text-align: center; border: 2px solid #ffffff; }

              /* Spacing Utility */
              .p-40 { padding: 40px; }
              .p-30 { padding: 30px; }
              .mb-30 { margin-bottom: 30px; }
              .mt-30 { margin-top: 30px; }

              /* Mobile Responsive */
            @media only screen and (max-width: 600px) {
                  .container { width: 100% !important; padding-left: 20px; padding-right: 20px; }
                  .p-40 { padding: 30px 20px !important; }
                  .p-30 { padding: 25px 20px !important; }
                  .mobile-stack { display: block !important; width: 100% !important; padding-bottom: 20px; }
                  h1 { font-size: 26px !important; }
            }
          </style>
        </head>
        <body>

          <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                  <td align="center" style="padding-top: 30px; padding-bottom: 40px;">
                      <table class="container" border="0" cellpadding="0" cellspacing="0">
                          
                          <tr>
                              <td align="left" style="padding-bottom: 30px;">
                                  <img src="https://i.imgur.com/k83w5gc.png" alt="RSM Logo" width="120">
                              </td>
                          </tr>

                          <tr>
                              <td align="left" style="padding-bottom: 20px;">
                                  <h1>Your E-Invoicing Assessment Report is Ready</h1>
                                  <p>Dear ${personalInfo.name},<br><br>We would like to thank you for your participation in completing the e-invoicing assessment questionnaire for ${personalInfo.company}. This report contains a comprehensive summary of your responses regarding your organization's e-invoicing requirements, current systems, and implementation needs.</p>
                                  <p>Based on the information you have provided, our team will review your requirements and prepare a detailed proposal for e-invoicing implementation services. This report will serve as the foundation for understanding your technical landscape, integration requirements, and compliance needs.</p>
                                  <p>Please do not hesitate to contact us if you have any questions or would like to schedule a consultation session with our e-invoicing team to discuss the next steps in your e-invoicing implementation journey.</p>
                              </td>
                          </tr>

                          <tr>
                              <td align="center" style="padding-bottom: 15px;">
                                  <table border="0" cellspacing="0" cellpadding="0">
                                      <tr>
                                          <td class="attachment-badge">
                                              <strong>Note:</strong> Your full PDF report is attached below
                                          </td>
                                      </tr>
                                  </table>
                              </td>
                          </tr>

                          <!-- Image removed for now - will be added back later -->
                          <!--
                          <tr>
                              <td align="center" style="padding-bottom: 30px;">
                                  <img src="https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM%20KUWAIT%20TAX/RSM%20Kuwait%20brand/d007d516-b985-4230-ae81-70467da2a078.png" alt="Assessment Report Preview" width="100%" style="border-radius: 16px; border: 1px solid #eeeeee;">
                              </td>
                          </tr>
                          -->

                          <tr>
                              <td style="padding-bottom: 30px;">
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0" class="rounded-block bg-rsm-blue">
                                      <tr>
                                          <td class="p-40" valign="middle" style="color: #ffffff;">
                                              <p style="color: #e0e0e0; margin-bottom: 0;">Our team specializes in e-invoicing implementation, FTA compliance, and system integration services. Please contact us to schedule a consultation on how we can assist with your organization's e-invoicing implementation and ensure compliance with UAE FTA requirements.</p>
                                          </td>
                                      </tr>
                                  </table>
                              </td>
                          </tr>

                          <tr>
                              <td align="left" style="padding-top: 20px; border-top: 1px solid #eeeeee;">
                                  <p class="disclaimer"><strong>Disclaimer:</strong> This e-invoicing assessment questionnaire is designed to gather information about your organization's e-invoicing requirements, current systems, and implementation needs. The information provided will be used to prepare a proposal and guide the implementation process. This assessment does not constitute legal or tax advice. Please consult with your tax advisor for specific compliance requirements. RSM shall not be liable for any losses, damages, claims, or expenses arising from, or in connection with, the use of the assessment results or any recommendations provided.</p>
                                  
                                  <p class="footer-text" style="margin-top: 30px;">
                                      <img src="https://i.imgur.com/k83w5gc.png" alt="RSM Logo" width="80" style="opacity: 0.6; margin-bottom: 15px;"><br>
                                      RSM MENA - E-Invoicing Consulting Team<br>
                                      2026 RSM. All rights reserved.
                                  </p>
                              </td>
                          </tr>

                      </table>
                  </td>
              </tr>
          </table>

        </body>
      </html>
    `;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.FROM_EMAIL) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      try {
        await transporter.verify();
        console.log('SMTP server connection verified');
      } catch (verifyError: any) {
        console.error('SMTP verification failed:', verifyError);
        console.error('SMTP Config:', {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE,
          user: process.env.SMTP_USER ? '***' : 'MISSING',
          pass: process.env.SMTP_PASS ? '***' : 'MISSING',
          from: process.env.FROM_EMAIL,
        });
      }

      console.log('Sending email to user:', personalInfo.email);
      try {
        const userEmailResult = await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: personalInfo.email,
          replyTo: 'anisha@cs.rsm.ae',
          subject: `E-Invoicing Assessment Report – ${personalInfo.company}`,
          html: userEmailContent,
          attachments: [
            {
              filename: `${personalInfo.company.replace(/[^a-zA-Z0-9]/g, '_')}_E_Invoicing_Assessment_Report.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ],
        });
        console.log('User email sent successfully. MessageId:', userEmailResult.messageId);
        userEmailSent = true;
      } catch (userEmailError: any) {
        console.error('Error sending user email:', userEmailError);
        console.error('Email error details:', {
          message: userEmailError?.message,
          code: userEmailError?.code,
          response: userEmailError?.response,
          command: userEmailError?.command,
        });
      }

      console.log('Sending internal notification email...');
      try {
        const internalEmailResult = await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: "arpit.m@nexuses.in,anisha.a@nexuses.in",
          replyTo: 'anisha@cs.rsm.ae',
          subject: "E-Invoicing Assessment - UAE",
          html: emailContent,
        });
        console.log('Internal email sent successfully. MessageId:', internalEmailResult.messageId);
      } catch (internalEmailError) {
        console.error('Error sending internal email:', internalEmailError);
      }
    } else {
      console.warn('Skipping assessment emails because SMTP environment variables are missing');
    }

    // Write assessment data to Google Sheets
    console.log('Writing to Google Sheets...');
    try {
      await writeToGoogleSheets(personalInfo, answers, assessment.totalScore, pdfS3Url);
      console.log('Google Sheets write completed');
    } catch (sheetsError) {
      console.error('Error writing to Google Sheets:', sheetsError);
      // Continue even if Google Sheets write fails
    }

    console.log('Assessment processing completed successfully');
    res.status(200).json({ 
      message: 'Assessment results sent successfully',
      emailSent: userEmailSent,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error in assessment processing:', error);
    console.error('Error stack:', error?.stack);
    res.status(500).json({ 
      message: 'Failed to send assessment results',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    })
  }
}
