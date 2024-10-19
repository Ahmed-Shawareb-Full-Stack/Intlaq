CREATE TABLE country (
    country_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE state (
    state_id SERIAL PRIMARY KEY,
    country_id INTEGER REFERENCES country(country_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE city (
    city_id SERIAL PRIMARY KEY,
    state_id INTEGER REFERENCES state(state_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE address (
    address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id INTEGER REFERENCES country(country_id) ON DELETE CASCADE,
    state_id INTEGER REFERENCES state(state_id) ON DELETE CASCADE,
    city_id INTEGER REFERENCES city(city_id) ON DELETE CASCADE,
    details TEXT
);
CREATE TABLE employee (
    employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    national_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    address_id UUID REFERENCES address(address_id) ON DELETE SET NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    bio TEXT,
    experience_level VARCHAR(50),
    profile_views INTEGER DEFAULT 0
);
CREATE TABLE programming_languages (
    language_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE employee_languages (
    employee_id UUID REFERENCES employee(employee_id) ON DELETE CASCADE,
    language_id INTEGER REFERENCES programming_languages(language_id) ON DELETE CASCADE,
    PRIMARY KEY (employee_id, language_id)
);

CREATE TABLE employer (
    employer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE job_posting (
    job_posting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES employer(employer_id) ON DELETE CASCADE,
    job_title VARCHAR(100) NOT NULL,
    job_description TEXT NOT NULL,
    city_id INTEGER REFERENCES city(city_id) ON DELETE SET NULL,
    required_experience VARCHAR(50)
);

CREATE TABLE application (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employee(employee_id) ON DELETE CASCADE,
    job_posting_id UUID REFERENCES job_posting(job_posting_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);