const path = require('path');
const t = require('@babel/types');

const STYLED_SOURCES = new Set(['@emotion/styled', '@emotion/styled/base']);

const getHelperImportPath = (filename) => {
  const helperPath = path.resolve(__dirname, 'src/helpers/withTuiClass');
  let relativePath = path.relative(path.dirname(filename), helperPath);

  if (!relativePath.startsWith('.')) relativePath = `./${relativePath}`;

  return relativePath.replaceAll('\\', '/');
};

module.exports = function () {
  return {
    visitor: {
      Program: {
        enter(programPath, state) {
          state.withTuiClassName =
            programPath.scope.generateUidIdentifier('withTuiClass');
        },
        exit(programPath, state) {
          const styledImport = programPath.node.body.find(
            (statement) =>
              t.isImportDeclaration(statement) &&
              STYLED_SOURCES.has(statement.source.value)
          );
          const defaultImport = styledImport?.specifiers.find((specifier) =>
            t.isImportDefaultSpecifier(specifier)
          );
          const styledImportName = defaultImport?.local.name;

          if (!styledImportName) return;

          programPath.traverse({
            CallExpression(callPath) {
              const styledFactory = callPath.node.callee;

              if (
                callPath.node.__hasTuiClass ||
                !t.isCallExpression(styledFactory) ||
                !t.isIdentifier(styledFactory.callee, {
                  name: styledImportName
                })
              ) {
                return;
              }

              callPath.node.__hasTuiClass = true;
              state.needsTuiClassHelper = true;
              callPath.replaceWith(
                t.callExpression(state.withTuiClassName, [callPath.node])
              );
              callPath.skip();
            }
          });

          if (!state.needsTuiClassHelper) return;

          programPath.unshiftContainer(
            'body',
            t.importDeclaration(
              [
                t.importSpecifier(
                  state.withTuiClassName,
                  t.identifier('withTuiClass')
                )
              ],
              t.stringLiteral(getHelperImportPath(state.filename))
            )
          );
        }
      }
    }
  };
};
