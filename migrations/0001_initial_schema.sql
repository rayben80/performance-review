-- 클라우드사업본부 업무평가 시스템 초기 스키마

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin' 또는 'user'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 관리자 테이블 (별도 관리)
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by TEXT,
    source TEXT DEFAULT 'manual', -- 'manual' 또는 'member'
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 조직 테이블
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'department', 'team', 'part'
    parent_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- 조직 구성원 테이블
CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    position TEXT,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE(user_id, organization_id)
);

-- 평가 항목 테이블
CREATE TABLE IF NOT EXISTS evaluation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    weight INTEGER DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'quantitative', -- 'quantitative' 또는 'qualitative'
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 평가 세션 테이블
CREATE TABLE IF NOT EXISTS evaluation_sessions (
    id TEXT PRIMARY KEY,
    evaluator_id TEXT NOT NULL, -- 평가자
    evaluatee_id TEXT NOT NULL, -- 피평가자
    type TEXT NOT NULL, -- 'self' 또는 'peer'
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 평가 점수 테이블
CREATE TABLE IF NOT EXISTS evaluation_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    score INTEGER, -- 정량평가 점수
    comment TEXT,  -- 정성평가 또는 추가 코멘트
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES evaluation_items(id) ON DELETE CASCADE,
    UNIQUE(session_id, item_id)
);

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_eval_sessions_evaluator ON evaluation_sessions(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_eval_sessions_evaluatee ON evaluation_sessions(evaluatee_id);
CREATE INDEX IF NOT EXISTS idx_eval_sessions_type ON evaluation_sessions(type);
CREATE INDEX IF NOT EXISTS idx_eval_scores_session ON evaluation_scores(session_id);
CREATE INDEX IF NOT EXISTS idx_eval_scores_item ON evaluation_scores(item_id);

-- 기본 데이터 삽입
INSERT OR IGNORE INTO users (id, name, email, role) VALUES 
    ('admin', '관리자', 'admin@company.com', 'admin');

INSERT OR IGNORE INTO admin_users (id, user_id, assigned_by, source) VALUES 
    ('admin_1', 'admin', 'system', 'manual');

-- 기본 평가 항목 데이터
INSERT OR IGNORE INTO evaluation_items (name, description, weight, type, order_index) VALUES 
    ('업무 성과', '담당 업무의 목표 달성도 및 품질', 30, 'quantitative', 1),
    ('협업 능력', '팀워크 및 의사소통 능력', 25, 'quantitative', 2),
    ('전문성', '업무 관련 지식 및 기술 수준', 25, 'quantitative', 3),
    ('개선 제안', '업무 개선 및 혁신 제안 능력', 20, 'qualitative', 4);

-- 시스템 설정 기본값
INSERT OR IGNORE INTO system_settings (key, value, description) VALUES 
    ('system_name', '클라우드사업본부 업무평가 시스템', '시스템 이름'),
    ('evaluation_scale', '5', '평가 척도 (1-5점)'),
    ('auto_save_interval', '30', '자동 저장 간격 (초)');