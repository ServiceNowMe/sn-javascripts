var FirewallMgmtUtils = Class.create();
FirewallMgmtUtils.prototype = {
    /*
     *   @author: phanikumar.gv@
     *   This method is used for making REST API calls, has an option to ignore TLS handshake errors
     *   @param: url
     *   @param: trustInsecureHosts (whether to ignore TLS handshake errors)
     */
    performAPIQuery: function(url, trustInsecureHosts) {
        var HttpGet = Packages.org.apache.http.client.methods.HttpGet;
        var HttpClients = Packages.org.apache.http.impl.client.HttpClients;
        var TrustSelfSignedStrategy = Packages.org.apache.http.conn.ssl.TrustSelfSignedStrategy;
        var SSLConnectionSocketFactory = Packages.org.apache.http.conn.ssl.SSLConnectionSocketFactory;
        var entityUtils = Packages.org.apache.http.util.EntityUtils;
        var SSLContextBuilder = Packages.org.apache.http.conn.ssl.SSLContextBuilder;
        try {
            var httpGet = new HttpGet(url);
            var sslContextBuilder = new SSLContextBuilder();
            sslContextBuilder.loadTrustMaterial(null, new TrustSelfSignedStrategy());

            var sslConnectionSocketFactory;
            if ("true".equalsIgnoreCase(trustInsecureHosts))
                sslConnectionSocketFactory = new SSLConnectionSocketFactory(sslContextBuilder.build(), SSLConnectionSocketFactory.ALLOW_ALL_HOSTNAME_VERIFIER);
            else
                sslConnectionSocketFactory = new SSLConnectionSocketFactory(sslContextBuilder.build());
            var httpclient = HttpClients.custom().setSSLSocketFactory(sslConnectionSocketFactory).build();

            var response = httpclient.execute(httpGet);
            var statusCode = -1;
            if (response != null && response.getStatusLine() != null && response.getStatusLine().getStatusCode() != null)
                statusCode = parseInt(response.getStatusLine().getStatusCode());
        } catch (e) {
            ms.log("Error : Unable to fetch response from URL,  exception is " + e);
        }
        return (statusCode >= 200 && statusCode < 300) ? entityUtils.toString(response.getEntity()) : null;
    },

    /*
     *   @author: phanikumar.gv@
     *   This method is used for getting cred details for the provided credAlisName
     *   @param: credsAliasName(i,e tag)
     *      Description: alias name of the discovery cred
     *      Type: String
     */
    getCredentialByAliasName: function(credAliasName) {
        var authKey = null;
        var credentialType = "api_key";
        var credFactory = Packages.com.snc.commons.credentials.CredentialsProviderFactory;
        var dbString = Packages.com.snc.automation_common.integration.creds.CredentialType;
        var dbStringConv = [dbString.fromDbString(credentialType)];
        var creds = credFactory().getCredentialsProvider().iterator(dbStringConv, null, null, credAliasName);
        creds.addQuery('tag', credAliasName);
        creds.addNotNullQuery('api_key');
        creds.query();

        if (creds.hasNext())
        return creds.next().getAttribute("api_key");

        ms.log("Error : Unable to find valid credential");
        return null;
    },

    fetchSecurityPolicies: function(url, trustInsecureHosts, prerulesXpath, postrulesXpath, isSharedDevGrp, devicesList) {
        var devices = this.parseDevicesHash(devicesList);
        var preRules = this.parseSecurityPolicies(this.performAPIQuery(url + prerulesXpath + "/security/rules", trustInsecureHosts), prerulesXpath, isSharedDevGrp, devices);
        var postRules = this.parseSecurityPolicies(this.performAPIQuery(url + postrulesXpath + "/security/rules", trustInsecureHosts), postrulesXpath, isSharedDevGrp, devices);
        var response = {};
        if (preRules && postRules)
            response['rules'] = preRules.concat(postRules);
        else if (postRules)
            response['rules'] = postRules;
        else if(preRules)
            response['rules'] = preRules;
        return JSON.stringify(response);

    },

    parseSecurityPolicies: function(payload, ruleBase, isSharedDevGrp, devicesList) {
        var helper = new XMLHelper(payload);
        var obj = helper.toObject();
        return this.parseRules(obj, ruleBase, isSharedDevGrp, devicesList);
    },

    parseRules: function(payload, ruleBase, isSharedDevGrp, devicesList) {
        if (!payload || !payload["result"] ||
            payload["@status"].toLowerCase().localeCompare("success") != 0)
            return;
        var inputRules = null;
        if ("true".localCompare(isSharedDevGrp) == 0)
            inputRules = payload["result"][ruleBase] && payload["result"][ruleBase]["security"] && payload["result"][ruleBase]["security"]["rules"] ? payload["result"][ruleBase]["security"]["rules"]["entry"] : null;
        else
            inputRules = payload["result"]["rules"] ? payload["result"]["rules"]["entry"] : null;

        if (inputRules == null)
            return;
        var rules = new Array();
        // if the response has only one element convert it to array
        if (!Array.isArray(inputRules)) {
            inputRules = new Array(inputRules);
        }
        for (var i in inputRules) {
            var rule = {};
			var deviceListCopy = new Packages.java.util.ArrayList(devicesList);
            rule.name = inputRules[i]["@name"];
            rule.uuid = inputRules[i]["@uuid"] ? inputRules[i]["@uuid"] : "";
            rule.action = inputRules[i]["action"] ? inputRules[i]["action"] : " ";
            rule.destination_zones = inputRules[i]["to"]["member"].toString();
            rule.ordinal = i * 1 + 1;
            rule.policy_tags = inputRules[i]["tag"] ? inputRules[i]["tag"]["member"].toString() : "";
            rule.policy_schedule = inputRules[i]["schedule"];
            rule.source_applications = inputRules[i]["application"]["member"].toString();
            rule.source_services = inputRules[i]["service"]["member"].toString();
            rule.source_zones = inputRules[i]["from"]["member"].toString();
            rule.url_categories = inputRules[i]["category"]["member"].toString();
            rule.destination_addresses = inputRules[i]["destination"]["member"].toString();
            rule.group_profile = inputRules[i]["profile-setting"] && inputRules[i]["profile-setting"]["group"] && inputRules[i]["profile-setting"]["group"]["member"] ? inputRules[i]["profile-setting"]["group"]["member"].toString() : "";
            rule.hip_profiles = inputRules[i]["hip-profiles"]["member"].toString();
            rule.log_end = inputRules[i]["log-end"].localeCompare("yes") == 0 ? true : false;
            rule.log_settings = inputRules[i]["log-setting"];
            rule.log_start = inputRules[i]["log-start"].localeCompare("yes") == 0 ? true : false;
            rule.short_description = inputRules[i]["description"] ? inputRules[i]["description"] : "";
            rule.source_addresses = inputRules[i]["source"]["member"].toString();
            rule.source_users = inputRules[i]["source-user"]["member"].toString();
            rule.rule_type = ruleBase;
            var inputDevices = new Packages.java.util.ArrayList();
            rule.devices = new Packages.java.util.ArrayList();
            var devices = inputRules[i]["target"]["devices"] ? inputRules[i]["target"]["devices"]["entry"] : "";
            if (devices) {
                if (!Array.isArray(devices))
                    devices = new Array(devices);
                for (var j in devices)
                    inputDevices.add(devices[j]["@name"]);
            } else
                inputDevices = deviceListCopy;
            if ("yes".equalsIgnoreCase(inputRules[i]["target"]["negate"])) {
                deviceListCopy.removeAll(inputDevices);
                rule.devices = deviceListCopy;
            } else
                rule.devices = inputDevices;
            rule.devices = "," + rule.devices.toString().replace("[", "").replace("]", "").replace(" ", "") + ",";
            this.formatAttributes(rule);
            rules[i] = rule;
        }
        return rules;
    },
    fetchPanoramaInfo: function(panoramaUrl, trustInsecureHosts) {
        var response = {};
        var result = this.parsePanorama(this.performAPIQuery(panoramaUrl, trustInsecureHosts));
        if (result) {
            if (!result.host) {
                var url = new Packages.java.net.URL(panoramaUrl);
                result.host = url.getHost();
            }
            response['manager'] = result;
            return JSON.stringify(response);
        }
        ms.log("Error : Unable to parse response from URL ");
        return null;
    },
    parsePanorama: function(payload) {
        var helper = new XMLHelper(payload);
        var obj = helper.toObject();
        return this.parsePanoramaInt(obj);
    },

    parsePanoramaInt: function(payload) {
        if (!payload || !payload["result"] || !payload["result"]["system"] || payload["@status"].toLowerCase().localeCompare("success") != 0)
            return;

        var inputManager = payload["result"]["system"];
        var manager = {};
        manager.name = inputManager["devicename"];
        manager.ip_address = inputManager["ip-address"];
        manager.mac_address = inputManager["mac-address"];
        manager.serial_number = inputManager["serial"];
        manager.app_release_date = inputManager["app-release-date"] ? new Date(inputManager["app-release-date"]) : "";
        manager.app_version = inputManager["app-version"];
        manager.cloud_mode = inputManager["cloud-mode"];
        manager.cloud_services = inputManager["cloud_services"];
        manager.cpu = inputManager["num-cpus"];
        manager.default_gateway = inputManager["default-gateway"];
        manager.family = inputManager["family"];
        manager.hostname = inputManager["hostname"];
        manager.host = null;
        manager.ipv6_address = inputManager["ipv6-address"];
        manager.ipv6_default_gateway = inputManager["ipv6-default-gateway"];
        manager.ipv6_link_local_address = inputManager["ipv6-link-local-address"];
        manager.manufacturer = "Palo Alto Networks";
        manager.memory = inputManager["ram-in-gb"];
        manager.model = inputManager["model"];
        manager.netmask = inputManager["netmask"];
        manager.platform_family = inputManager["platform-family"];
        manager.public_ip_address = inputManager["public-ip-address"];
        manager.software_version = inputManager["sw-version"];
        manager.system_mode = inputManager["system-mode"];
        manager.uptime = inputManager["uptime"];
        manager.vm_cpuid = inputManager["vm-cpuid"];
        manager.vm_mode = inputManager["vm-mode"];
        manager.vm_uuid = inputManager["vm-uuid"];
        manager.access_domain = inputManager["domain"];
        manager.antivirus_release_date = inputManager["av-release-date"] ? new Date(inputManager["av-release-date"]) : "";
        manager.antivirus_version = inputManager["av-version"];
        manager.global_protect_client_package_version = inputManager["global-protect-client-package-version"];
        manager.is_dhcp = inputManager["is-dhcp"].localeCompare("yes") == 0 ? true : false;
        manager.logdb_version = inputManager["logdb-version"];
        manager.operational_mode = inputManager["operational-mode"];
        manager.short_description = inputManager["description"] ? inputManager["description"] : "";
        manager.comments = inputManager["tag"] ? inputManager["tag"] : "";
        manager.url_db = inputManager["url-db"];
        manager.url_filtering_version = inputManager["url-filtering-version"];
        manager.vpn_disable_mode = inputManager["vpn-disable-mode"];
        manager.wildfire_version = inputManager["wildfire-version"];
        manager.wildfire_version_date = inputManager["wildfire-release-date"] ? new Date(inputManager["wildfire-release-date"]) : "";
        manager.wildfire_private_version = inputManager["wf-private-version"];
        manager.wildfire_private_version_date = (inputManager["wf-private-release-date"] && ("unknown".localeCompare(inputManager["wf-private-release-date"]) != 0)) ? new Date(inputManager["wf-private-release-date"]) : "";
        manager.threat_version = inputManager["threat-version"];
        manager.threat_version_date = inputManager["threat-release-date"] ? new Date(inputManager["threat-release-date"]) : "";
        this.formatAttributes(manager);
        return manager;
    },
    fetchFirewallDevices: function(devicesUrl, trustInsecureHosts) {
        var response = {};
        response['devices'] = this.parseDevices(this.performAPIQuery(devicesUrl, trustInsecureHosts));
        return JSON.stringify(response);
    },
    parseDevices: function(payload) {
        var helper = new XMLHelper(payload);
        var obj = helper.toObject();
        return this.parseDevice(obj);
    },

    parseDevice: function(payload) {
        if (!payload || !payload["result"] || !payload["result"]["devices"] ||
            !payload["result"]["devices"]["entry"] ||
            payload["@status"].toLowerCase().localeCompare("success") != 0)
            return;

        var inputDevices = payload["result"]["devices"]["entry"];
        var devices = new Array();

        // if the response has only one element convert it to array
        if (!Array.isArray(inputDevices)) {
            inputDevices = new Array(inputDevices);
        }
        for (var i in inputDevices) {
            var device = {};
            device.name = inputDevices[i]["@name"];
            device.serial_number = inputDevices[i]["serial"];
            device.app_version = inputDevices[i]["app-version"];
            device.default_gateway = inputDevices[i]["default-gateway"];
            device.family = inputDevices[i]["family"];
            device.hostname = inputDevices[i]["hostname"];
            device.is_connected = inputDevices[i]["connected"].localeCompare("yes") == 0 ? true : false;
            device.is_deactivated = inputDevices[i]["deactivated"].localeCompare("yes") == 0 ? true : false;
            device.ip_address = inputDevices[i]["ip-address"];
            device.ipv6_address = inputDevices[i]["ipv6-address"];
            device.ipv6_default_gateway = inputDevices[i]["ipv6-default-gateway"];
            device.ipv6_link_local_address = inputDevices[i]["ipv6-link-local-address"];
            device.manufacturer = "Palo Alto Networks";
            device.model = inputDevices[i]["model"];
            device.netmask = inputDevices[i]["netmask"];
            device.platform_family = inputDevices[i]["platform-family"];
            device.software_version = inputDevices[i]["sw-version"];
            device.uptime = inputDevices[i]["uptime"];
            device.access_domain = inputDevices[i]["domain"];
            device.antivirus_version = inputDevices[i]["av-version"];
            device.certificate_expiry = inputDevices[i]["certificate-expiry"] ? new Date(inputDevices[i]["certificate-expiry"]) : "";
            device.certificate_status = inputDevices[i]["certificate-status"];
            device.certificate_subject_name = inputDevices[i]["certificate-subject-name"];
            device.connected_at = inputDevices[i]["connected-at"] ? new Date(inputDevices[i]["connected-at"]) : "";
            device.custom_certificate_usage = inputDevices[i]["custom-certificate-usage"].localeCompare("yes") == 0 ? true : false;
            device.global_protect_client_package_version = inputDevices[i]["global-protect-client-package-version"];
            device.is_dhcp = inputDevices[i]["is-dhcp"].localeCompare("yes") == 0 ? true : false;
            device.is_multi_vsys = inputDevices[i]["multi-vsys"].localeCompare("yes") == 0 ? true : false;
            device.is_unsupported_version = inputDevices[i]["unsupported-version"].localeCompare("yes") == 0 ? true : false;
            device.logdb_version = inputDevices[i]["logdb-version"];
            device.operational_mode = inputDevices[i]["operational-mode"];
            device.previous_antivirus_version = inputDevices[i]["prev-av-version"];
            device.previous_app_version = inputDevices[i]["prev-app-version"];
            device.previous_wildfire_version = inputDevices[i]["prev-wildfire-version"];
            device.previous_threat_version = inputDevices[i]["prev-threat-version"];
            device.short_description = inputDevices[i]["description"] ? inputDevices[i]["description"] : "";
            device.comments = inputDevices[i]["tag"] ? inputDevices[i]["tag"] : "";
            device.threat_version = inputDevices[i]["threat-version"];
            device.url_db = inputDevices[i]["url-db"];
            device.url_filtering_version = inputDevices[i]["url-filtering-version"];
            device.vpn_disable_mode = inputDevices[i]["vpn-disable-mode"];
            device.vsys = "";
            if (inputDevices[i]["vsys"] && inputDevices[i]["vsys"]["entry"]) {
                var inputDeviceVsys = inputDevices[i]["vsys"]["entry"];
                if (inputDeviceVsys['@name'] || inputDeviceVsys.length) {
                    if (inputDeviceVsys['@name'])
                        device.vsys = inputDeviceVsys["@name"];
                    else
                        inputDeviceVsys.forEach(function(vSysObj) {
                            device.vsys = (!device.vsys) ? vSysObj["@name"] : (device.vsys + ',' + vSysObj["@name"]);
                        });
                }
            }
            device.wildfire_version = inputDevices[i]["wildfire-version"];
            this.formatAttributes(device);
            devices[i] = device;
        }
        return devices;

    },

    fetchFirewallDeviceGroups: function(deviceGroupsUrl, trustInsecureHosts, managerIdentifier) {
        var response = {};
        response['deviceGroups'] = this.parseDeviceGroups(this.performAPIQuery(deviceGroupsUrl, trustInsecureHosts), managerIdentifier);
        return JSON.stringify(response);
    },
    parseDeviceGroups: function(payload, managerIdentifier) {
        var helper = new XMLHelper(payload);
        var obj = helper.toObject();
        return this.parseDeviceGroup(obj , managerIdentifier);
    },

    parseDeviceGroup: function(payload, managerIdentifier) {
        if (!payload || !payload["result"] || !payload["result"]["devicegroups"] || !payload["result"]["devicegroups"]["entry"] || payload["@status"].toLowerCase().localeCompare("success") != 0)
            return;

        var deviceGroups = new Array();
        var inputDeviceGroups = payload["result"]["devicegroups"]["entry"];

        // if the response has only one element convert it to array
        if (!Array.isArray(inputDeviceGroups))
            inputDeviceGroups = new Array(inputDeviceGroups);
        for (var i in inputDeviceGroups) {
            var deviceGroup = {};
            deviceGroup.name = inputDeviceGroups[i]["@name"];
            deviceGroup.manufacturer = "Palo Alto Networks";
            deviceGroup.shared_policy_md5 = inputDeviceGroups[i]["shared-policy-md5sum"] ? inputDeviceGroups[i]["shared-policy-md5sum"] : " ";
            deviceGroup.short_description = inputDeviceGroups[i]["description"] ? inputDeviceGroups[i]["description"] : "";
            deviceGroup.comments = inputDeviceGroups[i]["tag"] ? inputDeviceGroups[i]["tag"] : "";
            this.formatAttributes(deviceGroup);
            deviceGroups[i] = deviceGroup;

        }

        // force shared as a device group and set all attr else pattern parsing fails
        var sharedDeviceGroup = {};
        sharedDeviceGroup.name = "shared_devicegroup_" + managerIdentifier;
        sharedDeviceGroup.manufacturer = "Palo Alto Networks";
        sharedDeviceGroup.shared_policy_md5 = "shared_policy_md5";
        sharedDeviceGroup.short_description = "";
        sharedDeviceGroup.comments = "";

        deviceGroups.push(sharedDeviceGroup);

        return deviceGroups;
    },

    fetchDevicesForDeviceGroup: function(url, trustInsecureHosts) {
        var response = {};
        response['devices'] = this.parseDevicesForDeviceGroups(this.performAPIQuery(url, trustInsecureHosts));
        return JSON.stringify(response);
    },

    parseDevicesForDeviceGroups: function(payload) {
        var helper = new XMLHelper(payload);
        var obj = helper.toObject();
        return this.parseDevicesForDeviceGroup(obj);
    },

    parseDevicesForDeviceGroup: function(payload) {
        if (!payload || !payload["result"] || !payload["result"]["devices"] || !payload["result"]["devices"]["entry"] ||
            payload["@status"].toLowerCase().localeCompare("success") != 0)
            return;
        var devices = payload["result"]["devices"]["entry"];
        var result = new Array();
        if (!Array.isArray(devices))
            devices = new Array(devices);
        for (var i in devices) {
            result[i] = devices[i]["@name"];
        }
        return result;

    },

    fetchDevicesForSecPolicy: function(url, trustInsecureHosts, devicesHash) {
        var response = {};
        var devices = this.parseDevicesHash(devicesHash);
        response['devices'] = this.parseDevicesForSecPolicy(this.performAPIQuery(url, trustInsecureHosts), devices);
        return JSON.stringify(response);
    },

    parseDevicesHash: function(devicesHash) {
        if(!devicesHash || devicesHash.toString() == '[]')
           return new Packages.java.util.ArrayList();
        var temp = devicesHash.toString().match(/(name=([^,]*))/g);
        return new Packages.java.util.ArrayList(temp.toString().replace(/name=/g, "").replace(/[{}]/g,"").replace(/]/g,"").split(","));
    },

    parseDevicesForSecPolicy: function(payload, devices) {
        var helper = new XMLHelper(payload);
        var obj = helper.toObject();
        return this.parseDevicesForSecPolicyInt(obj, devices);
    },

    parseDevicesForSecPolicyInt: function(payload, allDevices) {
        if (!payload || !payload["result"] || !payload["result"]["target"] ||
            payload["@status"].toLowerCase().localeCompare("success") != 0)
            return;
        var devices = new Packages.java.util.ArrayList();
        var result = [];
        if (payload["result"]["target"]["devices"]) {
            var temp = payload["result"]["target"]["devices"]["entry"];
            result = new Array();
            if (!Array.isArray(temp))
                temp = new Array(temp);
            for (var i in temp) {
                devices.add(temp[i]["@name"]);
            }
        } else
            devices = allDevices;
        if ("yes".equalsIgnoreCase(payload["result"]["target"]["negate"])) {
            allDevices.removeAll(devices);
            result = allDevices;
        } else
            result = devices;
        return result.toArray();
    },

    formatAttributes: function(obj) {
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr) && obj[attr] == undefined)
                obj[attr] = "";
        }
    }

};