const query = (() => {
	/** @type {Object.<string, string>} */
	var query = {}
	var url = decodeURIComponent(location.href.replaceAll("+", " "))
	var things = url.split("?").slice(1).join("?").split("#")[0].split("&")
	if (Boolean(things[0])) {
		for (var a = 0; a < things.length; a++) {
			var name =  things[a].split("=")[0]
			var value = things[a].split("=")[1]
			query[name] = value
		}
	} else {
		query = {}
	}
	return query
})();
/**
 * @param {string} item
 * @param {string} default_value
 */
function query_get(item, default_value) {
	if (Object.keys(query).includes(item)) {
		return query[item]
	} else return default_value
}