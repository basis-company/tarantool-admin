 Ext.define('Admin.data.proxy.PagingDispatch', {

  extend: 'Ext.data.proxy.Memory',
  alias: 'proxy.pagingdispatch',

  job: null,

  read: function(operation) {

    var params = Ext.apply({}, this.params, {
      limit: operation.getLimit(),
      offset: operation.getStart()
    });

    dispatch(this.job, params)
      .then(response => {
        var resultSet = new Ext.data.ResultSet({
          total: response.total,
          count: (response.data || []).length,
          records: (response.data || []).map(row => {
            Ext.Array.insert(row, 0, [Ext.id()]);
            return operation._scope.model.create(row);
          }),
        });
        operation.setResultSet(resultSet);
        operation.setSuccessful(true);
      });
  }
});
