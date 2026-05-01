# core.config — 系统配置

## 职责

集中管理运行期全局系统参数的读取和修改，所有配置以键值对形式存储于 system_config 表，变更即时生效，无需重启服务。

## 主要功能

- 企业名称（company_name）的查询与更新（CEO 权限），用于登录页、打印单据等展示场景
- 考勤计量单位配置（attendance.leave.unit / attendance.overtime.unit）的查询（所有登录用户）与更新（CEO），支持 HOUR / HALF_DAY / DAY 三种单位
- 发薪周期配置（payroll.payday / payroll.settlement.cutoff）的查询（CEO/FINANCE）与更新（CEO）；payday 为月发薪日（1-28），settlementCutoff 为发薪日前 N 天结算截止
- 数据保留天数配置（data.retention.days）的查询与更新（CEO），最小值 365 天

## 对外暴露的接口

- `GET /api/config/company-name` — 读取企业名称（已认证用户）
- `PUT /api/config/company-name` — 更新企业名称（CEO）
- `GET /api/config/attendance-unit` — 读取考勤计量单位（已认证用户）
- `POST /api/config/attendance-unit` — 更新考勤计量单位（CEO）
- `GET /api/config/payroll-cycle` — 读取发薪周期（CEO/FINANCE）
- `PUT /api/config/payroll-cycle` — 更新发薪周期（CEO）
- `GET /api/config/retention-period` — 读取数据保留天数（CEO）
- `PUT /api/config/retention-period` — 更新数据保留天数（CEO）

## 依赖

无（基础配置层）

## 技术债 / 待完善

- 配置键为硬编码字符串常量，分散在 SystemConfigController 和 SetupService 两处，存在键名漂移风险，应统一到枚举或常量类
- 更新配置无变更日志，无法追溯历史值
