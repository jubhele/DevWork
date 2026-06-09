-- Add 'Converted' to bf_quotes.status ENUM (required for quote-to-invoice conversion feature)
ALTER TABLE bf_quotes
  MODIFY COLUMN status
    ENUM('Draft','Sent','Approved','Rejected','Pending Approval','Expired','Converted')
    NOT NULL DEFAULT 'Draft';
