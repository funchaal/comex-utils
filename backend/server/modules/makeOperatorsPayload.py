import pandas as pd
from modules.utils import normalize_column_names

def makeOperatorsPayload(df):
    countries_df = pd.read_csv('./countries.csv', sep=';')
    df = normalize_column_names(df)

    payload, errors = [], []
    seq = 0

    for _, row in df.iterrows():
        seq += 1
        row_errors = []

        raiz = str(row.get('raiz', '')).replace('.', '').strip()[:8]
        nome = row.get('nome', '').strip()
        logradouro = row.get('endereco', '').strip()
        cidade = row.get('cidade', '').strip()
        codigo_interno = str(row.get('codigo interno', '')).strip()
        codigo = str(row.get('codigo', '')).strip()
        situacao = row.get('situacao', 'ATIVADO').strip()
        cep = str(row.get('cep', '')).strip()
        tin = str(row.get('tin', '')).strip()
        versao = str(row.get('versao', '')).strip()
        email = row.get('email', '').strip()
        subdivisao = row.get('subdivisao', '').strip()
        nome_pais = str(row.get('pais', '')).strip().lower()
        codigo_pais_input = str(row.get('codigo pais', '')).strip().upper()

        # Definir código do país
        if codigo_pais_input:
            codigo_pais = codigo_pais_input
        else:
            codigo_pais = next(
                (item['Code'] for _, item in countries_df.iterrows()
                 if nome_pais in str(item.get('nome', '')).strip().lower() or
                    str(item.get('nome', '')).strip().lower() in nome_pais),
                None
            )

        # Verificação dos campos obrigatórios
        if not raiz:
            row_errors.append("Campo obrigatório 'cpfCnpjRaiz' está em branco.")
        if not nome:
            row_errors.append("Campo obrigatório 'nome' está em branco.")
        if not logradouro:
            row_errors.append("Campo obrigatório 'logradouro' está em branco.")
        if not cidade:
            row_errors.append("Campo obrigatório 'nomeCidade' está em branco.")
        if not codigo_pais:
            row_errors.append(f"Campo obrigatório 'codigoPais' não encontrado para '{nome_pais}'.")

        for err in row_errors:
            errors.append({
                'seq': seq,
                'codigo': codigo_interno,
                'erro': err
            })

        item = {
            'seq': seq,
            'cpfCnpjRaiz': raiz.zfill(8),
            'nome': nome,
            'logradouro': logradouro,
            'nomeCidade': cidade,
            'codigoPais': codigo_pais
        }

        # Campos opcionais — adicionados apenas se preenchidos
        if codigo:
            item['codigo'] = codigo
        if codigo_interno:
            item['codigoInterno'] = codigo_interno
        if situacao:
            item['situacao'] = situacao
        if cep:
            item['cep'] = cep
        if tin:
            item['tin'] = tin
        if versao:
            item['versao'] = versao
        if email:
            item['email'] = email
        if subdivisao:
            item['codigoSubdivisaoPais'] = subdivisao

        payload.append(item)

    return payload, errors
