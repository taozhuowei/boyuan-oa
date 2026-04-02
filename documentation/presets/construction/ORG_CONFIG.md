# 博渊·建筑工程版 — 组织与人员架构配置

> **文档职责**：定义员工、岗位、等级、角色、组织架构五个核心概念及其关系，是薪资规则、权限控制、审批路由所有配置的基础。
>
> **目标读者**：产品经理、后端开发者（种子数据配置）、前端开发者（权限渲染逻辑）。
>
> **不包含**：审批流引擎（见 `WORKFLOW_CONFIG.md §1`）；页面布局（见 `UI_DESIGN.md`）。

---

## 1. 概念模型

系统中的人员由四个**独立正交**的维度描述，不要混用：

```
员工 Employee（系统的最小主体单元）
 ├── 岗位 Position      你是什么人、干什么活、怎么算薪资、有哪些功能
 ├── 等级 Level         你在这个岗位里处于哪个薪资段（可选）
 ├── 角色 Role          你在系统里能做哪些操作（权限控制）
 └── 直系领导 Supervisor 你向谁汇报、谁审批你的单据
```

**为什么要分开？**

| 混淆场景 | 正确理解 |
|---------|---------|
| "项目经理"既是岗位也是系统权限 | 岗位="项目经理"是薪资/功能配置；角色=`project_manager` 是审批权限。二者通常对齐，但可以分离 |
| "劳工"是特殊员工类型 | 劳工只是一个 `requiresConstructionLog=true` 的岗位，系统里所有人统一为"员工" |
| 薪资规则应该配到角色上 | 薪资规则配到岗位/等级，角色只控制操作权限 |

---

## 2. 员工（Employee）

系统的最小主体单元，所有业务数据都关联到员工。

**核心字段：**

| 字段 | 说明 |
|-----|------|
| `employeeNo` | 员工工号，唯一，系统自动生成或手动录入 |
| `name` | 姓名 |
| `positionId` | 所属岗位（必填） |
| `levelId` | 所属等级（可选，未配置时取岗位默认值） |
| `roleCode` | 系统权限角色（默认取岗位的 `defaultRoleCode`，可覆盖） |
| `directSupervisorId` | 直系领导员工 ID（可选，取值逻辑见 §6） |
| `employeeType` | 员工类别，OFFICE 或 LABOR（由岗位的 `employeeCategory` 自动同步，不单独设置） |
| `status` | ACTIVE / INACTIVE / SUSPENDED |
| `hireDate` | 入职日期 |
| 个人薪资覆盖 | 可覆盖岗位/等级的薪资配置，需 CEO 审批生效（见 §7） |

> **employeeType 说明**：员工类别不单独配置，直接从其岗位的 `employeeCategory` 同步。更换岗位时自动更新。OFFICE 员工使用 Web 端为主，LABOR 员工以小程序为主。

---

## 3. 岗位（Position）

定义"这类员工是做什么的"，是薪资规则、功能开关、假期配置的主要载体。

**核心字段：**

### 3.1 基本信息

| 字段 | 说明 |
|-----|------|
| `positionCode` | 岗位编码，唯一，如 `WELDER` / `PM` / `FINANCE` |
| `positionName` | 显示名称，如 焊工 / 项目经理 / 财务 |
| `employeeCategory` | 员工类别：`OFFICE` \| `LABOR` |
| `defaultRoleCode` | 该岗位员工默认关联的系统角色，可被个人覆盖 |
| `supervisorPositionCode` | 该岗位的直系上级岗位编码（用于组织架构推导，见 §6） |

### 3.2 功能开关

| 字段 | 默认值 | 说明 |
|-----|--------|------|
| `requiresConstructionLog` | false | true 时员工可见施工日志入口，且需定期提交 |
| `hasPerformanceBonus` | false | true 时工资条含绩效奖金行，OFFICE 岗位通常为 true |
| `requiresPhysicalCheckin` | false | true 时需要现场打卡，LABOR 岗位通常为 true |

### 3.3 薪资配置（可被等级覆盖，可被个人覆盖）

| 字段 | 说明 |
|-----|------|
| `baseSalary` | 基本工资（月固定） |
| `performanceBase` | 绩效奖金基准值（`hasPerformanceBonus=true` 时生效） |
| `overtimeBase` | 加班计算基数：`BASIC_SALARY` \| `TOTAL_SALARY` \| `CUSTOM` |
| `overtimeRateWeekday` | 平日加班倍率，默认 1.5 |
| `overtimeRateWeekend` | 周末加班倍率，默认 2.0 |
| `overtimeRateHoliday` | 节假日加班倍率，默认 3.0 |
| `leaveDeductBase` | 请假扣款基数：`BASIC_SALARY` \| `TOTAL_SALARY` \| `CUSTOM` |
| `sickLeaveDeductRate` | 病假扣款比例，默认 0.5（即扣半日薪） |
| `housingFundRate` | 公积金个人缴纳比例，默认 5% |

### 3.4 社保配置（可被个人覆盖）

| 字段 | 说明 |
|-----|------|
| `socialInsuranceMode` | `COMPANY_PAID`（公司代缴）\| `MERGED_SALARY`（并入工资） |
| `socialInsuranceRates` | JSON，各险种个人缴纳比例（养老 8%、医疗 2%、失业 0.5%，可按城市标准调整）；`MERGED_SALARY` 模式下仅需配置合计比例 |

### 3.5 假期配置（可被等级覆盖）

| 字段 | 说明 |
|-----|------|
| `annualLeaveDays` | 年假天数，默认 5 天 |
| `sickLeaveDaysPerYear` | 年度病假上限，默认不限 |

---

## 4. 等级（Level）

等级是**岗位内的薪资分段**，可选配置。每个岗位可以定义若干等级，各等级独立配置薪资数值，不与其他岗位的等级共用。

**设计原则：**
- 等级归属于特定岗位，不跨岗位共用
- 员工关联岗位后，可进一步关联该岗位下的某个等级
- 未关联等级的员工，直接取岗位的默认配置值

**等级字段：**

| 字段 | 说明 |
|-----|------|
| `positionId` | 归属岗位 |
| `levelCode` | 等级编码，如 `L1` / `L2` / `SENIOR` |
| `levelName` | 显示名称，如 初级 / 中级 / 高级 |
| `baseSalary` | 覆盖岗位默认基本工资 |
| `performanceBase` | 覆盖岗位绩效奖金基准 |
| `annualLeaveDays` | 覆盖岗位年假天数 |

**示例：**
```
岗位：焊工（baseSalary=6000）
  等级 L1（初级焊工）：baseSalary=5500，annualLeaveDays=5
  等级 L2（中级焊工）：baseSalary=7000，annualLeaveDays=7
  等级 L3（高级焊工）：baseSalary=9000，annualLeaveDays=10
```

---

## 5. 角色（Role）

角色是**纯粹的权限控制维度**，定义"你在系统里能做哪些操作"，与岗位完全独立。

**内置角色（不可删除）：**

| roleCode | 显示名称 | 权限定位 |
|---------|---------|---------|
| `ceo` | CEO | 全局终审、系统配置、数据管理 |
| `finance` | 财务 | 薪资结算、工伤理赔录入、员工档案协管 |
| `project_manager` | 项目经理 | 初审、施工日志审批、项目成员管理 |
| `employee` | 员工 | 发起个人申请、查看本人数据 |
| `worker` | 劳工 | 同 employee，额外有施工日志和工伤补偿提交权 |

> **注意**：内置角色 `worker` 的权限不依赖岗位的 `requiresConstructionLog` 字段；`requiresConstructionLog` 控制的是员工是否**需要定期提交**（影响预结算校验逻辑），而不是是否有权提交（权限来自角色）。

**岗位与角色的关系：**
- 每个岗位有 `defaultRoleCode`，员工入职时系统自动关联
- CEO 可单独修改某员工的角色（与岗位解耦），例如让一个"高级工程师"拥有 `project_manager` 权限
- 角色变更立即生效，无需修改岗位

**自定义角色：**
- CEO 可在内置角色基础上新增自定义角色
- 从内置权限项中勾选组合
- 终审审批、解锁结算更正等高风险权限项不可分配给自定义角色

---

## 6. 组织架构（Org Tree）

每个员工都有唯一的直系领导，构成树形汇报关系，根节点为 CEO。

**直系领导的取值优先级（由高到低）：**

```
1. 员工档案中显式指定的 directSupervisorId（最优先）
2. 员工岗位配置的 supervisorPositionCode → 取该岗位的在职负责人
   （如：焊工岗位 supervisorPositionCode=现场工长，则找同项目的现场工长）
3. 所属项目的项目经理（若员工有项目归属）
4. CEO（兜底，所有路径失败时）
```

**组织树的用途：**

| 用途 | 说明 |
|-----|------|
| 审批路由 | 请假/加班找直系领导初审，无 PM 时自动上浮到上级，直至 CEO |
| 数据范围 | 项目经理可查看本项目员工数据；部门主管可查看下属数据 |
| 通知推送 | 加班通知、结算提醒沿组织树推送 |
| 汇报展示 | 经营总览的人员组织图 |

**组织架构配置页面：**
- CEO 可查看和编辑全员的组织关系树
- 支持拖拽调整汇报关系
- 修改直系领导需 CEO 确认（非自助修改）

---

## 7. 配置继承链

薪资规则、社保配置、假期配置等可配置项均遵循以下优先级，系统取最高优先级的非空值：

```
优先级 1（最低）：全局默认值
    ↓ 可覆盖
优先级 2：员工类别层（OFFICE / LABOR 各自的类别默认值）
    ↓ 可覆盖
优先级 3：岗位层（Position Config，见 §3）
    ↓ 可覆盖
优先级 4：等级层（Level Config，见 §4，等级存在时生效）
    ↓ 可覆盖
优先级 5（最高）：个人覆盖（Employee 个人配置，需 CEO 审批）
```

**修改权限：**

| 层级 | 谁可以修改 | 是否需要审批 |
|-----|-----------|------------|
| 全局默认值 | CEO | 无需审批（CEO直接操作） |
| 员工类别层 | CEO | 无需审批 |
| 岗位配置 | CEO / 财务 | 非CEO修改需CEO审批，下个结算周期生效 |
| 等级配置 | CEO / 财务 | 同上 |
| 个人覆盖 | CEO / 财务 | 财务修改需CEO审批，CEO直接修改无需审批 |

> **生效时机**：所有薪资相关配置的修改均在**下一个完整结算周期**生效，不影响当前进行中的周期。社保模式切换同理。

---

## 8. 种子数据（初始化示例）

以下为建筑工程版初始化时的参考岗位配置，实际配置由 CEO/sysadmin 在初始化向导中完成。

### 岗位示例

| positionCode | positionName | employeeCategory | defaultRoleCode | requiresConstructionLog | hasPerformanceBonus |
|-------------|-------------|-----------------|----------------|------------------------|---------------------|
| `CEO` | CEO | OFFICE | `ceo` | false | true |
| `FINANCE` | 财务 | OFFICE | `finance` | false | true |
| `PM` | 项目经理 | OFFICE | `project_manager` | false | true |
| `OFFICE_STAFF` | 办公人员 | OFFICE | `employee` | false | true |
| `WORKER` | 劳工 | LABOR | `worker` | true | false |
| `WELDER` | 焊工 | LABOR | `worker` | true | false |
| `PLUMBER` | 管工 | LABOR | `worker` | true | false |

### 组织层级示例

```
CEO
 └── 财务（汇报给 CEO）
 └── 项目经理 A（汇报给 CEO）
      └── 现场工长（汇报给项目经理 A）
           └── 焊工 × N（汇报给现场工长）
           └── 管工 × N
      └── 办公人员（汇报给项目经理 A）
 └── 项目经理 B
      └── ...
```

---

## 9. 岗位管理页功能设计

> 对应视图见 `UI_DESIGN.md §8`（岗位管理页）。

### 9.1 岗位 CRUD

- **查看**：CEO / 财务可查看岗位列表和配置详情
- **新增**：CEO 可新增岗位，填写所有字段
- **编辑**：CEO 直接修改；财务修改需提交 CEO 审批，审批通过后下个周期生效
- **删除**：仅 CEO 可删除；删除前需确认该岗位下无在职员工

### 9.2 等级 CRUD（在岗位详情页内管理）

- 每个岗位详情页下方展示"等级配置"子表格
- CEO / 财务均可管理等级（同岗位修改审批规则）
- 岗位下无等级时，全员取岗位默认配置

### 9.3 岗位复制

- 基于现有岗位创建新岗位（所有字段复制，可修改）
- 用于快速建立相似岗位（如 焊工→电工）

---

## 10. 常见问题

**Q：更换某员工的岗位后，薪资什么时候变？**
A：下个结算周期起按新岗位配置计算。当前周期用原岗位配置完成结算。

**Q：一个员工可以同时有两个岗位吗？**
A：不可以，每个员工同一时刻只能有一个岗位。需要调整时先离职旧岗、入职新岗。

**Q：角色和岗位可以不对应吗？**
A：可以。岗位决定薪资，角色决定操作权限，二者可以独立配置。例如某员工岗位是"高级工程师"，但 CEO 给他分配了 `project_manager` 角色，他就有了审批权。

**Q：施工日志的提交权限来自岗位还是角色？**
A：权限来自角色（`worker` 角色有提交权）；岗位的 `requiresConstructionLog=true` 控制的是**是否要求定期提交**（影响预结算完整性校验，以及首页是否显示提交提醒）。
