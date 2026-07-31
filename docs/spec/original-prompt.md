# Original Specification

Source: [ChatGPT shared conversation](https://chatgpt.com/s/t_6a6cc6cac010819195fdcfb7530fd89c)
("Salary Deduction Calculation Malaysia"), captured verbatim below.

---

Below is a ready-to-use prompt for Claude. I structured it so Claude builds the app with configurable statutory rates rather than hard-coding assumptions that may change.

You are a senior full-stack engineer, product designer, and Malaysian payroll-calculation specialist.

Build a production-ready, mobile-first web application or Progressive Web App called "My Net Salary Planner".

The purpose of the application is to help a Malaysian employee understand:

Monthly net salary after statutory deductions.

How much weekend-support allowance is actually received after deductions.

How much can be allocated toward savings and monthly expenses.

The difference between gross additional income and actual take-home income.

## 1. Preferred technology stack

Use a modern, maintainable stack:

Frontend: Next.js with TypeScript

Styling: Tailwind CSS

UI components: shadcn/ui

Backend: Next.js server actions or API routes

Database: PostgreSQL

ORM: Prisma

Authentication: Auth.js

Charts: Recharts

Validation: Zod

Testing: Vitest and Playwright

Deployment-ready for Docker

PWA support with installable mobile experience and offline access to previously saved calculations

Use the latest stable versions available at development time.

The application must be responsive and easy to use on Android phones, iPhones, tablets, and desktop browsers.

## 2. User profile and default assumptions

Allow the user to save a payroll profile containing:

Malaysian citizen or non-citizen

Age

Tax-resident status

Marital status

Whether spouse has income

Number of children

Percentage of child relief claimed

EPF contribution rate

Zakat deduction

Additional TP1 tax reliefs

Whether LINDUNG 24 Jam applies

Currency, defaulting to MYR

Preferred monthly savings target

Emergency-fund target

Provide the following initial default profile:

Malaysian citizen

Below 60 years old

Malaysian tax resident

Married

Spouse has no income

Four children below 18

User claims 100% child relief for all four children

Employee EPF rate: 11%

LINDUNG 24 Jam: excluded

No zakat by default

No bonus by default

Do not permanently hard-code statutory rates. Store rates, contribution tables, tax brackets, ceilings, relief limits, and effective dates in configurable database records or structured configuration files.

## 3. Salary entry

Create a monthly salary-entry form with these fields:

Payroll month

Basic salary

Fixed allowance

Weekend-support allowance

Bonus

Commission

Other taxable income

Other non-taxable reimbursement

Employee EPF adjustment

Zakat

Previous cumulative income for the year

Previous cumulative PCB paid

Notes

The user must be able to enter a basic salary such as:

RM19,088

RM19,188

RM19,288

RM19,388

RM19,488

RM19,588

RM19,688

RM20,266

RM21,266

RM22,266

RM23,266

Weekend support must be treated by default as an allowance or additional wage, not statutory overtime.

## 4. Payroll calculation requirements

Calculate and display:

Basic salary

Total gross salary

EPF employee contribution

SOCSO employee contribution

EIS employee contribution

Estimated PCB

Zakat

Other deductions

Total deductions

Net salary

Net additional income from weekend support

Effective deduction rate

Effective take-home percentage

### EPF

Weekend-support allowance is normally EPF-liable because it is treated as an allowance or additional wage.

The application must:

Support the official EPF contribution table

Support salary-band calculations where required

Support percentage calculations above the relevant threshold

Apply official rounding rules

Keep employee and employer contributions separate

Allow the administrator to update rates and effective dates

### SOCSO and EIS

Weekend-support allowance should be included in wages for SOCSO and EIS calculations.

However, when basic salary already exceeds the statutory wage ceiling, additional weekend-support allowance should not increase the employee SOCSO or EIS contribution beyond the applicable maximum.

The application must:

Use configurable contribution tables

Store statutory wage ceilings

Apply the appropriate contribution category

Support employees below and above 60

Show whether the maximum contribution has already been reached

### PCB

PCB must be presented as an estimate unless the implementation reproduces the official current LHDN calculation accurately.

The PCB engine should consider:

Annualised regular remuneration

Additional remuneration

Marital status

Spouse with or without income

Number of children

Child-relief percentage

EPF relief

SOCSO and EIS relief

Zakat

TP1 reliefs

Previous cumulative remuneration

Previous cumulative PCB

Tax brackets

Tax rebates

Payroll month

Bonus and additional remuneration

Show an explanation beside PCB stating that the actual payslip amount may differ because payroll uses cumulative PCB calculations and current LHDN rules.

## 5. Weekend-support calculation

Create a dedicated weekend-support calculator.

Inputs:

Basic monthly salary

Weekend-support payment method

Number of support days

Fixed payment per support day

Fixed monthly support allowance

Other support-related payment

Payroll month

Supported payment methods:

Fixed amount per support day

Fixed monthly allowance

Manually entered total support allowance

Outputs:

Gross weekend-support allowance

Additional EPF caused by weekend support

Additional SOCSO caused by weekend support

Additional EIS caused by weekend support

Additional PCB caused by weekend support

Net weekend-support amount

Percentage of weekend support retained

Total monthly net salary after weekend support

Do not calculate weekend support using an overtime multiplier unless the user explicitly selects an overtime mode.

### Comparison mode

Show two side-by-side results:

Salary without weekend support

Salary with weekend support

Clearly highlight:

Gross weekend-support amount

Extra statutory deductions

Extra PCB

Actual additional cash received

Example presentation:

Gross weekend support: RM1,000

Additional EPF: RM110

Additional SOCSO: RM0 because contribution ceiling has already been reached

Additional EIS: RM0 because contribution ceiling has already been reached

Estimated additional PCB: calculated based on cumulative tax position

Net weekend support: result

Net percentage retained: result

Do not simply assume that every RM1,000 always produces RM640 net. That may be shown only as an optional quick estimate. The proper result must come from the configured payroll and tax engine.

## 6. Savings planner

After calculating net salary, allow the user to plan the salary allocation.

Include categories such as:

Monthly commitments

Housing

Car

Utilities

Food

Children

Insurance or takaful

Debt payments

Investment

Emergency fund

General savings

Weekend-support savings

Personal spending

Allow allocation using either:

Fixed MYR amount

Percentage of net salary

Show:

Total net salary

Total committed expenses

Available balance

Savings amount

Savings percentage

Amount contributed by weekend support

Whether the savings target was achieved

Projected annual savings

Add an option called:

"Save all net weekend-support income"

When enabled, the application automatically assigns the entire net weekend-support amount to the selected savings or investment category.

## 7. Dashboard

Create a clean dashboard with these cards:

Current gross salary

Current net salary

Total deductions

Net weekend-support income

Monthly savings

Annual projected savings

Include charts for:

Gross salary versus net salary

Deduction breakdown

Weekend-support gross versus net

Monthly savings trend

Salary and support history

Annual income, deductions, and savings

Use accessible labels and do not rely on colours alone.

## 8. Calculation history

Allow the user to:

Save monthly payroll calculations

Edit previous calculations

Duplicate the previous month

Compare two months

Filter by year

Export calculations to CSV

Export a monthly payslip-style PDF

Delete records with confirmation

View annual totals

Annual summary should include:

Total gross basic salary

Total weekend-support allowance

Total EPF

Total SOCSO

Total EIS

Total PCB

Total net salary

Total savings

Average effective deduction rate

## 9. Admin configuration

Provide a protected admin area to manage:

EPF employee rates

EPF employer rates

EPF salary bands

EPF rounding rules

SOCSO tables

EIS tables

Statutory wage ceilings

Malaysian income-tax brackets

Tax rebates

Personal reliefs

Spouse relief

Child relief

EPF tax-relief limits

SOCSO and EIS tax-relief limits

Effective dates

Source references

Configuration version

Each calculation must store which configuration version was used so historical calculations do not silently change when statutory rates are updated.

## 10. User experience

The application must be simple enough to use in less than one minute.

Mobile layout should prioritise:

Basic salary

Weekend-support allowance

Calculate button

Net salary

Net weekend-support amount

Savings allocation

Use Malaysian formatting:

Currency: RM19,088.00

Dates: DD/MM/YYYY

Time zone: Asia/Kuala_Lumpur

Add clear tooltips explaining:

Gross salary

EPF

SOCSO

EIS

PCB

Additional remuneration

Net weekend support

Effective deduction rate

## 11. PWA requirements

Implement:

Installable PWA

App manifest

Service worker

Mobile home-screen icon support

Offline access to previously saved calculations

Offline creation of draft salary entries

Synchronisation when connection returns

Appropriate cache strategy

Update notification when a new app version is available

Do not cache sensitive authentication responses insecurely.

## 12. Security and privacy

Salary information is sensitive.

Implement:

Secure authentication

Password hashing

CSRF protection

Server-side authorisation

Row-level ownership checks

Input validation

Secure cookies

Rate limiting

Audit logging for administrative configuration changes

Encryption considerations for sensitive payroll records

No exposure of salary information in client-side logs

No third-party analytics by default

Provide a privacy setting allowing the user to run the calculator locally without creating an account. Local-mode data should remain on the user's device.

## 13. Data model

Design Prisma models for at least:

User

PayrollProfile

SalaryEntry

SalaryCalculation

DeductionBreakdown

SavingsPlan

SavingsAllocation

PayrollConfiguration

EPFRate

EPFWageBand

SOCSORate

EISRate

TaxBracket

TaxRelief

TaxRebate

AuditLog

Store monetary values using decimal types, never floating-point types.

## 14. Calculation architecture

Create a calculation engine separated from the user interface.

Suggested modules:

calculateGrossIncome()

calculateEPF()

calculateSOCSO()

calculateEIS()

calculateAnnualTaxableIncome()

calculatePCB()

calculateWeekendSupportNet()

calculateNetSalary()

calculateSavingsAllocation()

Each function should:

Accept typed input

Return a detailed calculation breakdown

Be deterministic

Have comprehensive unit tests

Avoid hidden constants

Use versioned configuration

Explain rounding decisions

## 15. Testing requirements

Write tests covering:

Salary below and above EPF thresholds

Salary above SOCSO and EIS wage ceilings

Weekend-support allowance with EPF

Weekend support when SOCSO and EIS are already capped

Married employee with spouse having no income

Four children fully claimed

Bonus and additional remuneration

Zakat deductions

Mid-year salary changes

Previous cumulative PCB

Rounding boundaries

Configuration effective-date changes

RM19,088 salary with different weekend-support amounts

RM23,266 salary with different weekend-support amounts

Include property-based or table-driven tests for payroll bands where appropriate.

## 16. Seed data and examples

Seed the development database with:

A married Malaysian employee

Spouse with no income

Four children

Basic salary RM19,088

LINDUNG 24 Jam disabled

Weekend-support examples of RM500, RM1,000, RM1,500, RM2,000, and RM3,000

Also include saved examples for the following salaries:

RM19,188, RM19,288, RM19,388, RM19,488, RM19,588, RM19,688, RM20,266, RM21,266, RM22,266, and RM23,266.

## 17. Disclaimer

Display this disclaimer:

"This application provides payroll and tax estimates for personal planning. Actual EPF, SOCSO, EIS and PCB deductions may differ according to official contribution tables, payroll configuration, cumulative remuneration, statutory updates and information submitted to the employer. Verify final payroll deductions with your employer, payroll provider, KWSP, PERKESO and LHDN."

## 18. Delivery approach

Do not generate the entire application as one oversized response.

Work in phases:

**Phase 1**

Confirm architecture

Produce folder structure

Define database schema

Define calculation assumptions

Create the versioned payroll-configuration format

**Phase 2**

Implement the payroll calculation engine

Add unit tests

Show test results for representative salary and weekend-support scenarios

**Phase 3**

Build the mobile-first user interface

Build the dashboard and savings planner

**Phase 4**

Add authentication, database persistence and calculation history

**Phase 5**

Add PWA functionality, offline mode, exports, Docker support and production documentation

Before writing application code, identify any statutory payroll values that must be verified against current official Malaysian sources. Keep those values in configurable seed data and clearly label any value that has not yet been officially verified.

Start with Phase 1 now. Produce:

Proposed architecture

Application user flow

Folder structure

Prisma schema

Payroll configuration JSON structure

Calculation-engine interface definitions

Key assumptions and unresolved statutory questions

A useful adjustment would be to tell Claude whether you prefer the backend to remain entirely inside Next.js or to use a separate NestJS API.
