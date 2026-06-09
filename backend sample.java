@RestResource(urlMapping='/v1/AccountingTasks/*')
global with sharing class AccountingTaskAPI {

    // ==========================================
    // 1. READ (GET) - Fetch a single task or all
    // ==========================================
    @HttpGet
    global static void getAccountingTasks() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        res.addHeader('Content-Type', 'application/json');
        
        // Extract the ID from the end of the URL if present
        String taskId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            if (taskId != 'AccountingTasks' && String.isNotBlank(taskId)) {
                // Fetch specific record
                List<Accounting_Task__c> tasks = [SELECT Id, Name, Amount__c, Type__c, Status__c, Description__c 
                                                  FROM Accounting_Task__c WHERE Id = :taskId WITH SECURITY_ENFORCED];
                if (tasks.isEmpty()) {
                    res.statusCode = 404;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{'error' => 'Record not found'}));
                } else {
                    res.statusCode = 200;
                    res.responseBody = Blob.valueOf(JSON.serialize(tasks[0]));
                }
            } else {
                // Fetch all records (limited to 1000 for safety)
                List<Accounting_Task__c> allTasks = [SELECT Id, Name, Amount__c, Type__c, Status__c, Description__c 
                                                     FROM Accounting_Task__c WITH SECURITY_ENFORCED LIMIT 1000];
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(allTasks));
            }
        } catch (Exception e) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{'error' => e.getMessage()}));
        }
    }

    // ==========================================
    // 2. CREATE (POST) - Create a new task
    // ==========================================
    @HttpPost
    global static void createAccountingTask(Decimal amount, String taskType, String status, String description) {
        RestResponse res = RestContext.response;
        res.addHeader('Content-Type', 'application/json');
        
        try {
            Accounting_Task__c newTask = new Accounting_Task__c(
                Amount__c = amount,
                Type__c = taskType,
                Status__c = status,
                Description__c = description
            );
            
            // Enforce FLS and CRUD permissions natively
            SObjectAccessDecision decision = Security.stripInaccessible(AccessType.CREATABLE, new List<Accounting_Task__c>{newTask});
            insert decision.getRecords();
            
            Accounting_Task__c insertedTask = (Accounting_Task__c)decision.getRecords()[0];
            
            res.statusCode = 201;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'success' => 'true',
                'id' => insertedTask.Id,
                'message' => 'Accounting task created successfully.'
            }));
        } catch (Exception e) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{'error' => e.getMessage()}));
        }
    }

    // ==========================================
    // 3. DELETE (DELETE) - Remove a task
    // ==========================================
    @HttpDelete
    global static void deleteAccountingTask() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        res.addHeader('Content-Type', 'application/json');
        
        String taskId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            Accounting_Task__c taskToDelete = [SELECT Id FROM Accounting_Task__c WHERE Id = :taskId WITH SECURITY_ENFORCED LIMIT 1];
            
            // Perform delete operation if user has access
            if (Schema.sObjectType.Accounting_Task__c.isDeletable()) {
                delete taskToDelete;
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{'message' => 'Record successfully deleted'}));
            } else {
                res.statusCode = 403;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{'error' => 'Insufficient delete permissions'}));
            }
        } catch (Exception e) {
            res.statusCode = 404;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{'error' => 'Record not found or already deleted'}));
        }
    }

    // ==========================================
    // 4. UPDATE (PUT) - Upsert or completely update
    // ==========================================
    @HttpPut
    global static void upsertAccountingTask(String id, Decimal amount, String taskType, String status, String description) {
        RestResponse res = RestContext.response;
        res.addHeader('Content-Type', 'application/json');
        
        try {
            Accounting_Task__c task = new Accounting_Task__c(
                Id = id,
                Amount__c = amount,
                Type__c = taskType,
                Status__c = status,
                Description__c = description
            );
            
            SObjectAccessDecision decision = Security.stripInaccessible(AccessType.UPDATABLE, new List<Accounting_Task__c>{task});
            upsert decision.getRecords();
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{'message' => 'Record updated successfully'}));
        } catch (Exception e) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{'error' => e.getMessage()}));
        }
    }
}
