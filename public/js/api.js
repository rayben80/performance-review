/**
 * 클라우드사업본부 업무평가 시스템 - API 연동 모듈
 * LocalStorage에서 D1 데이터베이스로 전환을 위한 API 래퍼
 */

// API 기본 설정
const API_BASE_URL = '/api';

// API 요청 헬퍼 함수
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error(`API request failed for ${endpoint}:`, error);
        throw error;
    }
}

// 데이터베이스 API 클래스
class DatabaseAPI {
    // 데이터베이스 초기화
    async initializeDatabase() {
        try {
            const result = await apiRequest('/init-db', {
                method: 'POST'
            });
            console.log('✅ 데이터베이스 초기화 완료');
            return result;
        } catch (error) {
            console.error('❌ 데이터베이스 초기화 실패:', error);
            throw error;
        }
    }

    // 사용자 관련 API
    async getUsers() {
        return apiRequest('/users');
    }

    async createUser(userData) {
        return apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // 관리자 관련 API
    async getAdmins() {
        return apiRequest('/admins');
    }

    async createAdmin(adminData) {
        return apiRequest('/admins', {
            method: 'POST',
            body: JSON.stringify(adminData)
        });
    }

    // 평가 항목 관련 API
    async getEvaluationItems() {
        return apiRequest('/evaluation-items');
    }

    async createEvaluationItem(itemData) {
        return apiRequest('/evaluation-items', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    }

    // 조직 관련 API
    async getOrganizations() {
        return apiRequest('/organizations');
    }

    async createOrganization(orgData) {
        return apiRequest('/organizations', {
            method: 'POST',
            body: JSON.stringify(orgData)
        });
    }
}

// 데이터 마이그레이션 헬퍼
class DataMigration {
    constructor(dbAPI) {
        this.dbAPI = dbAPI;
    }

    // LocalStorage에서 D1으로 데이터 마이그레이션
    async migrateFromLocalStorage() {
        try {
            console.log('🔄 LocalStorage → D1 데이터 마이그레이션 시작...');

            // 1. 데이터베이스 초기화
            await this.dbAPI.initializeDatabase();

            // 2. LocalStorage 데이터 읽기
            const localData = this.getLocalStorageData();

            // 3. 평가 항목 마이그레이션
            if (localData.evaluationItems && localData.evaluationItems.length > 0) {
                console.log('📝 평가 항목 마이그레이션 중...');
                for (const item of localData.evaluationItems) {
                    try {
                        await this.dbAPI.createEvaluationItem({
                            name: item.name,
                            description: item.description,
                            weight: item.weight,
                            type: item.type,
                            order_index: item.id || 0
                        });
                    } catch (error) {
                        console.warn('평가 항목 마이그레이션 스킵:', item.name, error.message);
                    }
                }
            }

            // 4. 조직 데이터 마이그레이션
            if (localData.organizationData) {
                console.log('🏢 조직 데이터 마이그레이션 중...');
                for (const [orgId, orgData] of Object.entries(localData.organizationData)) {
                    try {
                        await this.dbAPI.createOrganization({
                            name: orgData.name,
                            type: orgData.type || 'department',
                            parent_id: orgData.parentId || null
                        });
                    } catch (error) {
                        console.warn('조직 데이터 마이그레이션 스킵:', orgData.name, error.message);
                    }
                }
            }

            // 5. 관리자 데이터 마이그레이션
            if (localData.adminUsers && localData.adminUsers.length > 0) {
                console.log('👤 관리자 데이터 마이그레이션 중...');
                for (const admin of localData.adminUsers) {
                    try {
                        // 먼저 사용자 생성
                        await this.dbAPI.createUser({
                            name: admin.name,
                            email: admin.email,
                            role: 'admin'
                        });
                    } catch (error) {
                        console.warn('관리자 사용자 마이그레이션 스킵:', admin.name, error.message);
                    }
                }
            }

            console.log('✅ 데이터 마이그레이션 완료!');
            showToast('LocalStorage 데이터가 성공적으로 데이터베이스로 이전되었습니다!', 'success');
            
            return true;
        } catch (error) {
            console.error('❌ 데이터 마이그레이션 실패:', error);
            showToast('데이터 마이그레이션 중 오류가 발생했습니다: ' + error.message, 'error');
            return false;
        }
    }

    // LocalStorage 데이터 읽기
    getLocalStorageData() {
        try {
            return {
                evaluationItems: JSON.parse(localStorage.getItem('evaluationItems') || '[]'),
                quantitativeItems: JSON.parse(localStorage.getItem('quantitativeItems') || '[]'),
                qualitativeItems: JSON.parse(localStorage.getItem('qualitativeItems') || '[]'),
                organizationData: JSON.parse(localStorage.getItem('organizationData') || '{}'),
                evaluationData: JSON.parse(localStorage.getItem('evaluationData') || '{}'),
                currentUser: JSON.parse(localStorage.getItem('currentUser') || '{}'),
                adminUsers: JSON.parse(localStorage.getItem('adminUsers') || '[]')
            };
        } catch (error) {
            console.error('LocalStorage 데이터 읽기 오류:', error);
            return {};
        }
    }

    // LocalStorage 데이터 백업
    backupLocalStorage() {
        const data = this.getLocalStorageData();
        const backup = {
            timestamp: new Date().toISOString(),
            data: data
        };

        // JSON 파일로 다운로드
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-system-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('💾 LocalStorage 데이터 백업 완료');
        showToast('데이터가 백업되었습니다.', 'success');
    }
}

// 전역 인스턴스 생성
const dbAPI = new DatabaseAPI();
const dataMigration = new DataMigration(dbAPI);

// 전역으로 노출
window.dbAPI = dbAPI;
window.dataMigration = dataMigration;

// 시스템 초기화시 자동 데이터베이스 연결 확인
async function checkDatabaseConnection() {
    try {
        await dbAPI.getUsers();
        console.log('✅ 데이터베이스 연결 확인 완료');
        return true;
    } catch (error) {
        console.warn('⚠️ 데이터베이스 연결 실패, LocalStorage 모드로 계속:', error.message);
        return false;
    }
}

// 데이터 저장 방식 전환 함수들
async function saveToDatabase() {
    if (window.dbConnected) {
        // D1 데이터베이스에 저장하는 로직
        console.log('💾 D1 데이터베이스에 저장 중...');
        // 실제 구현은 각 모듈에서 처리
    } else {
        // LocalStorage에 저장 (기존 방식)
        saveToStorage();
    }
}

async function loadFromDatabase() {
    if (window.dbConnected) {
        // D1 데이터베이스에서 로드하는 로직
        console.log('📖 D1 데이터베이스에서 로드 중...');
        // 실제 구현은 각 모듈에서 처리
    } else {
        // LocalStorage에서 로드 (기존 방식)
        loadFromStorage();
    }
}

console.log('✅ API 모듈이 로드되었습니다.');