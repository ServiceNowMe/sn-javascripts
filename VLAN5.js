function run() {
    var gr = new GlideRecord('cmdb_ci');
        gr.addEncodedQuery('name=VLAN5^operational_status=1');
        gr.setLimit(2);
        gr.query();
        
        var log = [];
        var obj = {};
        
        while (gr.next()) {
          
            obj.name = gr.name.getDisplayValue();
            obj.sys_id = gr.sys_id.getDisplayValue();
            obj.table = gr.sys_class_name.getValue();
            // Get current sys_id
            var sysID = gr.sys_id.getDisplayValue();
            // Get table name of the current CI
            var classX = gr.sys_class_name.getValue();
          
            var grs = new GlideRecord(classX);
                grs.get(sysID);
                grs;
                obj.CI = grs.cmdb_ci.getDisplayValue();          
                var json = new global.JSON().encode(obj);               
                log.push(json);
        }
        
    return log;
}
run();