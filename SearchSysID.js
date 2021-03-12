(function() {

    try {

        //options

        var searchId = "6ee0c1bbdb495054868294f7db96194f"; //Sys ID to search

        var addLink = false;  
        //initialize

        var tableName = "";

        var tableLabel = "";

        var tableWeWantToSearch = true;

        var foundRecord = false;

        var message = "";

        //loop through all the valid base-class tables (no need to look at any sub-classes)

        var table = new GlideRecord("sys_db_object");

        table.addEncodedQuery("super_class=NULL");

        table.query();

        while (table.next()) {

            //get the table name and label

            tableName = (table.getValue("name") + "").toLowerCase();

            tableLabel = (table.getValue("label") + "").toLowerCase();

            tableWeWantToSearch = true; 

            if (tableName.indexOf("v_") == 0) tableWeWantToSearch = false; //views

            else if (tableName == "ts_c_attachment") tableWeWantToSearch = false; //text search indices

            else if (tableName == "ts_chain") tableWeWantToSearch = false; //..

            else if (tableName == "ts_document") tableWeWantToSearch = false; //..

            else if (tableName == "ts_phrase") tableWeWantToSearch = false; //..

            else if (tableName == "ts_word") tableWeWantToSearch = false; //..

            else if (tableName == "ts_word_roots") tableWeWantToSearch = false; //..

            else if (tableLabel.indexOf("text index ") == 0) tableWeWantToSearch = false; //..

            else if (tableLabel.indexOf("ts index stats") == 0) tableWeWantToSearch = false; //..

            else if (tableLabel.indexOf("recorded incremental change") == 0) tableWeWantToSearch = false;

            else if (tableName.indexOf("sh$") == 0) tableWeWantToSearch = false;

            else if (tableLabel.indexOf("rollback sequence") == 0) tableWeWantToSearch = false;

            else if (tableLabel.indexOf("score level") == 0) tableWeWantToSearch = false;

            else if (tableLabel.indexOf("pa favorites") == 0) tableWeWantToSearch = false;

            else if (tableName.indexOf("syslog") == 0) tableWeWantToSearch = false;

            else if (tableName.indexOf("sys_cache_flush") == 0) tableWeWantToSearch = false;

            else if (tableName.indexOf("sys_db_cache") == 0) tableWeWantToSearch = false;

            if (tableWeWantToSearch) {

                var searchTable = new GlideRecord(table.getValue("name"));

                //make sure it is a valid table first

                if (searchTable.isValid()) {

                    //searchTable.setWorkflow(false);

                    searchTable.addQuery("sys_id", searchId);

                    searchTable.query();

                    while (searchTable.next()) {

                        foundRecord = true;

                        _showFoundRecord();

                    }

                } else {

                    message = "***** Trying to search an invalid table name called '" + table.getValue("name") + "' - the sys_id of that sys_db_object record is '" + table.getValue("sys_id") + "'";

                    gs.addInfoMessage(message);

                }

            }

        }

        if (foundRecord == false) {

            gs.addInfoMessage("The record was not found");

        }

    } catch (err) {

        gs.log("ERROR: " + err);

    }

    function _showFoundRecord() {

        var details = searchTable.getDisplayValue();

        if (addLink == true) {

            details = "<a href='" + gs.getProperty('glide.servlet.uri') + "nav_to.do?uri=" + searchTable.getLink() + "' target='_blank'>" + searchTable.getDisplayValue() + "</a>";

        }

        message = "Found a record of type '" + searchTable.getClassDisplayValue() + "' (" + searchTable.getRecordClassName() + ") called '" + details + "'";

        gs.addInfoMessage(message);

    }

})();