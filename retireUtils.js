function run () {
    var gr = new GlideRecord('cmdb_ci');
        gr.get('d32ae1c01b3f6410448c773bdc4bcb61');
        gr.query(); 
            //var log = [];
        var obj = {};
        if (!gr.next()) {      
                var json = new global.JSON().encode(obj);
        } else {
            var sysID = gr.sys_id.getDisplayValue();
            var classX = gr.sys_class_name.getValue();
            var grs = new GlideRecord(classX);
                grs.get(sysID);
                grs;
                      obj.name = grs.name.getDisplayValue();
                obj.dr = grs.u_disaster_recovery.getDisplayValue();
                var json = new global.JSON().encode(obj);
                      //log.push(json);
        }
    return json
    }
    run();
    //gs.print(log);