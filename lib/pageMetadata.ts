export type PageMeta = {
  title: string
  description: string
}

const pageMetadata: Record<string, PageMeta> = {
  "activities": {
    "title": "Daily Activities",
    "description": "Stay updated with our latest actions, protests, and community initiatives.\n          Join us in building a more accountable democracy."
  },
  "citizens-issue": {
    "title": "Citizens Issue Box",
    "description": "Submit your grievances and we'll raise them with the relevant authorities to ensure accountability and action."
  },
  "admin/dashboard": {
    "title": "Admin Dashboard",
    "description": "Logged in as {user.email}."
  },
  "admin/login": {
    "title": "Login",
    "description": "Admin access is restricted. To request authentication credentials, please send an email to the site administrator."
  },
  "donate": {
    "title": "Support Our Mission",
    "description": "Your contribution helps us fight for transparency, accountability, and justice.\n            Every rupee counts in building a better democracy."
  },
  "home": {
    "title": "Civic Opposition of India",
    "description": "Building a transparent, accountable democracy through collective civic action.\n              Together, we hold power accountable and create lasting change."
  },
  "partners/baf": {
    "title": "Bangalore Apartments’ Federation (BAF)",
    "description": "BAF is a collective of apartment communities in Bengaluru, working to address urban challenges, promote sustainability, and represent residents’ interests."
  },
  "partners/blrpost": {
    "title": "BLR Post",
    "description": "BLR Post is a digital news platform providing updates, stories, and analysis on Bengaluru’s civic, political, and social landscape."
  },
  "partners/citizen-matters": {
    "title": "Citizen Matters",
    "description": "Citizen Matters is an independent news platform covering urban issues, governance, and citizen engagement in Indian cities."
  },
  "partners/namma-bengaluru": {
    "title": "Namma Bengaluru Foundation",
    "description": "Namma Bengaluru Foundation works to protect Bengaluru’s lakes, environment, and civic spaces through advocacy, legal action, and community engagement."
  },
  "partners/whitefield-rising": {
    "title": "Whitefield Rising",
    "description": "Whitefield Rising is a citizen-driven movement focused on improving civic amenities, environment, and quality of life in the Whitefield area of Bengaluru."
  },
  "partners/wri-india": {
    "title": "WRI India",
    "description": "WRI India is a research organization that works on sustainable cities, climate, energy, and environment, providing data-driven solutions for India’s development."
  },
  "search": {
    "title": "Search",
    "description": "Learn more about Search on Civic Opposition of India."
  },
  "team/arif-mudgal": {
    "title": "ARIF MUDGAL",
    "description": "Member, Civic Opposition of India."
  },
  "team/capt-santhosh": {
    "title": "Capt Santhosh Kumar",
    "description": "Advisor, Civic Opposition of India."
  },
  "team/dr-ansiha": {
    "title": "Dr. Anisha",
    "description": "Co-founder, Civic Opposition of India."
  },
  "team/mithilesh-kumar": {
    "title": "Mithilesh Kumar",
    "description": "Founder – Civic Opposition of India."
  }
}

export function getMetadata(key: string): PageMeta {
  return pageMetadata[key] || {
    title: "Civic Opposition of India",
    description: "Building a transparent, accountable democracy through collective civic action.",
  }
}

export { pageMetadata }

export default pageMetadata
