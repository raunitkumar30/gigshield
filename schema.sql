-- GigShield Supabase Database Schema

-- 1. Riders Table
CREATE TABLE public.riders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    plan VARCHAR(50),
    zone VARCHAR(100),
    upi_id VARCHAR(100),
    onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Claims Table
CREATE TABLE public.claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rider_email VARCHAR(255) REFERENCES public.riders(email),
    event_type VARCHAR(100) NOT NULL,
    amount VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'In Review',
    zone VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Replication on Claims for Realtime cross-tab Sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.claims;

-- 3. Payouts Table
CREATE TABLE public.payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rider_email VARCHAR(255) REFERENCES public.riders(email),
    amount VARCHAR(50) NOT NULL,
    zone VARCHAR(100),
    event_type VARCHAR(100),
    upi_ref VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Replication on Payouts
ALTER PUBLICATION supabase_realtime ADD TABLE public.payouts;
