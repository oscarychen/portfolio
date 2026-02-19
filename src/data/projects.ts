export interface Project {
  name: string;
  description: string;
  date: string; // e.g. "Q1 2024", "Q3 2024"
  image?: string;
  url?: string;
  repo?: string;
  tags?: string[];
}

export const projects: Project[] = [
  {
    name: "PotatoRun",
    description: "Resource scheduling and reservation management system",
    date: "2025-2026",
    image: "https://www.potatorun.com/potatorun1.svg",
    url: "https://potatorun.com",
    tags: ["resource scheduling", "time management"],
  },
  {
    name: "django-ninja-simple-jwt",
    description: "Simple and elegant stateless JWT-based authentication built for django-ninja",
    date: "Dec 2023",
    image: "/images/arrows-exchange-2.svg",
    repo: "https://github.com/oscarychen/django-ninja-simple-jwt",
    tags: ["JWT authentication"],
  },
  {
    name: "Cocatus Autocoder",
    description: "Automated ICD-10 code generation for healthcare tracking and insurance billing",
    date: "2020-2022",
    image: "/images/cocatus-logo.png",
    url: "https://cocatus.com",
    tags: ["Natural language processing"],
  },
  {
    name: "drf-stripe-subscription",
    description: "A Django REST Framework library for managing Stripe-based subscriptions and payments",
    date: "Jan 2022",
    image: "/images/transaction-dollar.svg",
    repo: "https://github.com/oscarychen/drf-stripe-subscription",
    tags: ["Stripe integration"],
  },
  {
    name: "eau-de-go",
    description:
      "A scalable web backend template written in Golang with mux, featuring JWT auth, type-safe SQL queries, and Docker.",
    date: "Jan 2022",
    image: "/images/server.svg",
    repo: "https://github.com/oscarychen/eau-de-go",
    tags: ["Web"],
  },
  {
    name: "emr-pipeline-nlp",
    description: "A text processing pipeline for extracting clinical concepts using spaCy NLP",
    date: "2020",
    image: "/images/language.svg",
    repo: "https://github.com/oscarychen/emr-pipeline-nlp",
    tags: ["NLP", "EMR"],
  },
  {
    name: "brAInzViewer",
    description: "A desktop application for viewing and analyzing brain MRI images",
    date: "Apr 2019",
    image: "/images/brain.svg",
    repo: "https://github.com/oscarychen/brAInzViewer",
    tags: ["Computer vision", "MRI classification"],
  },
  {
    name: "Digital Rotary Encoder Menu for Arduino",
    description: "A menu system for Arduino using a digital rotary encoder",
    date: "2018",
    image: "/images/7-circle.svg",
    repo: "https://github.com/oscarychen/Digital-Rotary-Encoder-Menu-for-Arduino",
    tags: ["Arduino", "Menu system"],
  },
  {
    name: "Arduino Water Changer",
    description: "An automated water changer for aquariums using Arduino",
    date: "2017",
    image: "/images/exchange-2.svg",
    repo: "https://github.com/oscarychen/ArduinoWaterChanger",
    url: "https://oscarchen.ca/blog/arduino-aquarium-water-changer",
    tags: ["Arduino", "Automation"],
  },
];
