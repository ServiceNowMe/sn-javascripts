//Generate a new Catalog Item Script
//Copy of Request/Replace a Device with NSR [6180557c1b1924102d230e53cd4bcb9d]
var grCCST = new GlideRecord('cmdb_ci_service_technical');
grCCST.get('284955741b9924102d230e53cd4bcb09');
var cartId = GlideGuid.generate(null);
var cart = new Cart(cartId);
var item = cart.addItem('6180557c1b1924102d230e53cd4bcb9d'); 
cart.setVariable(item,'RequestADevice_type','Server');
cart.setVariable(item,'RequestADevice_Subtype','Virtual');
cart.setVariable(item,'RequestADevice_location','c1f0aeeddb3f7a009d30d12c5e96195b');
cart.setVariable(item,'RequestADevice_DevicePPR','e51bf3801b57c810bc58635bbc4bcb16');
cart.setVariable(item,'RequestADevice_DeviceName','LGVATEST99');
cart.setVariable(item,'dmz_details','Do not know DMZ details for this new device');
cart.setVariable(item,'u_ts',grCCST.getDisplayValue('name'));
cart.setVariable(item,'u_ts_mb',grCCST.getValue('managed_by'));
cart.setVariable(item,'u_ts_ob',grCCST.getValue('owned_by'));
cart.setVariable(item,'u_ts_sg',grCCST.getValue('support_group'));
cart.setVariable(item,'RequestADevice_Server_Application','6a4372d5db2e130c2062303f9d9619b1');
var rc = cart.placeOrder(); 
gs.addInfoMessage(rc.number);